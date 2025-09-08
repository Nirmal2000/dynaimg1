import { NextResponse } from 'next/server';
import { ToolRegistry } from '../../../tools/ToolRegistry';

const DEFAULT_MODEL = process.env.OPENROUTER_PLANNER_MODEL || 'openai/gpt-4o-mini';

const ALLOWED_TOOLS = Object.keys(ToolRegistry);

// Define pickTool function (similar to LangChain tool)
async function pickToolFunc({ tool, props }) {
  // Validate selected tool exists in registry
  if (!ALLOWED_TOOLS.includes(tool)) {
    return JSON.stringify({ error: 'Unknown tool', tool, props: props || {} });
  }
  return JSON.stringify({ tool, props: props || {} });
}

// Define tools schema for OpenRouter
function buildPickToolsSchema() {
  return [
    {
      type: 'function',
      function: {
        name: 'pick_tool',
        description:
          'Pick one prebuilt image editing tool component to render. Only choose from the allowed list. Include optional props if useful.',
        parameters: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              enum: ALLOWED_TOOLS,
            },
            props: {
              type: 'object',
              additionalProperties: true,
            },
          },
          required: ['tool'],
        },
      },
    },
  ];
}

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
  // Convert messages to plain {role, content, name?, tool_call_id?, tool_calls?}
  return messagesArr.map((m) => {
    const base = { role: m.role, content: m.content ?? '' };
    if (m.name) base.name = m.name;
    if (m.tool_call_id) base.tool_call_id = m.tool_call_id;
    if (m.tool_calls) base.tool_calls = m.tool_calls;
    return base;
  });
}

async function callOpenRouter(messages, toolsSchema) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (process.env.OPENROUTER_SITE_URL) headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  if (process.env.OPENROUTER_SITE_TITLE) headers['X-Title'] = process.env.OPENROUTER_SITE_TITLE;

  const body = {
    model: DEFAULT_MODEL,
    messages,
    tools: toolsSchema,
    tool_choice: 'required',
    parallel_tool_calls: true,
  };

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message || {};
}

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Compose message history: system + provided messages
    const history = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
    const updated = [...history];
    const selections = [];
    const toolsSchema = buildPickToolsSchema();

    // Iteratively invoke until the assistant returns no tool calls
    // Guard against infinite loops
    const MAX_ROUNDS = 8;
    let rounds = 0;
    while (rounds < MAX_ROUNDS) {
      rounds += 1;

      const aiMessage = await callOpenRouter(updated, toolsSchema);
      if (!aiMessage || !aiMessage.role) break;

      updated.push(aiMessage);

      if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
        break; // no more tool calls
      }

      for (const toolCall of aiMessage.tool_calls) {
        if (toolCall.name !== 'pick_tool') continue;

        try {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await pickToolFunc(args);

          const toolMessage = {
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
          };
          updated.push(toolMessage);

          const parsed = JSON.parse(result);
          if (parsed.tool) {
            selections.push({ tool: parsed.tool, props: parsed.props || {} });
          }
        } catch (e) {
          console.error('Error invoking pick_tool:', e);
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
