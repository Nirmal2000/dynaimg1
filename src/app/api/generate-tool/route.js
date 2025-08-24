import { ChatCerebras } from '@langchain/cerebras';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const llm = new ChatCerebras({
  model: process.env.MODEL_NAME || "qwen-3-coder-480b",
  temperature: 0,
});

// Load the system prompt from file
const getSystemPrompt = () => {
  try {
    const promptPath = join(process.cwd(), 'system-prompt.txt');
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Failed to load system prompt:', error);
    // Fallback system prompt
    return "You are a helpful coding assistant. When a user asks for a tool or code, provide clean, working code examples. Focus on practical, implementable solutions. Always respond with complete, self-contained HTML/CSS/JavaScript code when appropriate.";
  }
};

export async function POST(request) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Convert messages to LangChain format and add system prompt
    const systemPrompt = getSystemPrompt();
    const langchainMessages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await llm.invoke(langchainMessages);
    
    return NextResponse.json({
      content: response.content
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}