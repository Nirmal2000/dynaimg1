import { NextResponse } from 'next/server';
import { ChatCerebras } from '@langchain/cerebras';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ToolRegistry } from '../../../tools/ToolRegistry';

const llm = new ChatCerebras({
  model: process.env.MODEL_NAME || 'qwen-3-coder-480b',
  temperature: 0,
});

const ALLOWED_TOOLS = Object.keys(ToolRegistry);

// Define a LangChain tool that the model can call to pick a UI component.
const pickTool = tool(
  async ({ tool, props }) => {
    // Validate selected tool exists in registry
    if (!ALLOWED_TOOLS.includes(tool)) {
      return JSON.stringify({ error: 'Unknown tool', tool, props: props || {} });
    }
    return JSON.stringify({ tool, props: props || {} });
  },
  {
    name: 'pick_tool',
    description:
      'Pick one prebuilt image editing tool component to render. Only choose from the allowed list. Include optional props if useful.',
    schema: z.object({
      tool: z.enum(ALLOWED_TOOLS),
      props: z.record(z.any()).optional(),
    }),
  }
);

// System guidance to strongly bias tool calling behavior
const SYSTEM_PROMPT = `
You are an assistant that selects one or more prebuilt image editing tool components.
Call the pick_tool tool once per tool you want to add. If the request implies multiple tools, make multiple tool calls.
After selecting all tools, stop calling tools.
Allowed tools: ${ALLOWED_TOOLS.join(', ')}.
Examples of usage:
- "increase brightness" -> { tool: "brightness", props: { initialBrightness: 20 } }
- "reduce saturation by 30" -> { tool: "saturation", props: { initialSaturation: -30 } }
- "adjust hue to -45" -> { tool: "hue", props: { initialHue: -45 } }
- "increase contrast" -> { tool: "contrast", props: { initialContrast: 15 } }
- "rotate 90 degrees" -> { tool: "rotate", props: {} }
- "make it black and white" -> { tool: "filters", props: { preset: "grayscale" } }
 - "show histogram" -> { tool: "histogram" }
- "increase brightness and contrast" -> two tool calls: brightness + contrast
 - "add a blue tint" -> { tool: "tint", props: { initialColor: "#3366ff", initialStrength: 30 } }
 - "increase brightness and contrast" -> two tool calls: brightness + contrast
`;

function serializeMessagesForClient(messagesArr) {
  // Convert LangChain-like messages to plain {role, content, name?, tool_call_id?}
  return messagesArr.map((m) => {
    const role = m.role || m._getType?.();
    const base = { role, content: m.content ?? '' };
    if (m.name) base.name = m.name;
    if (m.tool_call_id) base.tool_call_id = m.tool_call_id;
    if (m.tool_calls) base.tool_calls = m.tool_calls;
    return base;
  });
}

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Compose message history: system + provided messages
    const history = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    const llmWithTools = llm.bindTools([pickTool]);
    const updated = [...history];
    const selections = [];

    // Iteratively invoke until the assistant returns no tool calls
    // Guard against infinite loops
    const MAX_ROUNDS = 8;
    let rounds = 0;
    while (rounds < MAX_ROUNDS) {
      rounds += 1;
      const aiMessage = await llmWithTools.invoke(updated);
      updated.push(aiMessage);

      if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
        break; // no more tool calls
      }

      const toolsByName = { pick_tool: pickTool };
      for (const toolCall of aiMessage.tool_calls) {
        const selectedTool = toolsByName[toolCall.name];
        if (!selectedTool) continue;

        // Invoke tool and append the tool message right after
        const toolMessage = await selectedTool.invoke(toolCall);
        updated.push(toolMessage);

        try {
          const parsed = JSON.parse(toolMessage.content || '{}');
          if (parsed.tool) {
            selections.push({ tool: parsed.tool, props: parsed.props || {} });
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      // Loop back to allow the model to add more tool calls if needed
    }

    const serialized = serializeMessagesForClient(updated);

    return NextResponse.json({ success: true, selections, messages: serialized });
  } catch (err) {
    console.error('pick-tool error:', err);
    return NextResponse.json({ success: false, error: 'Failed to select tool' }, { status: 500 });
  }
}
