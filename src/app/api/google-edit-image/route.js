import { NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// Model configured for image editing/generation preview
const MODEL_NAME = process.env.GOOGLE_IMAGE_MODEL || 'gemini-2.5-flash-image-preview';

const llm = new ChatGoogleGenerativeAI({
  model: MODEL_NAME,
  temperature: 0,
});

function toUserMessage(prompt, imageDataUrl) {
  // LangChain message with text + inline base64 image
  return {
    role: 'user',
    content: [
      { type: 'text', text: prompt || '' },
      imageDataUrl ? { type: 'image_url', image_url: imageDataUrl } : null,
    ].filter(Boolean),
  };
}

function extractImageDataUrl(aiMessage) {
  const blocks = Array.isArray(aiMessage?.content) ? aiMessage.content : [];
  for (const b of blocks) {
    if (b && typeof b === 'object') {
      if (b.image_url && (typeof b.image_url === 'string' || typeof b.image_url?.url === 'string')) {
        const url = typeof b.image_url === 'string' ? b.image_url : b.image_url.url;
        if (typeof url === 'string' && url.startsWith('data:image/')) {
          return url;
        }
      }
      // Some providers may return inlineData:{ data, mimeType }
      if (b.inline_data || b.inlineData) {
        const inline = b.inline_data || b.inlineData;
        const mime = inline.mimeType || 'image/png';
        if (inline.data) {
          return `data:${mime};base64,${inline.data}`;
        }
      }
    }
  }
  return null;
}

export async function POST(request) {
  try {
    const { prompt, imageDataUrl } = await request.json();
    if (!prompt || !imageDataUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt or image data' },
        { status: 400 }
      );
    }

    // Build messages array. Keep simple one-turn for now.
    const messages = [toUserMessage(prompt, imageDataUrl)];

    // Ask for both text and image in response if supported
    const aiMessage = await llm.invoke(messages, {
      // Some SDKs accept generationConfig; LangChain forwards extras
      // Not all backends support this, so it's best-effort.
      response_modalities: ['TEXT', 'IMAGE'],
    });

    const editedDataUrl = extractImageDataUrl(aiMessage);
    if (!editedDataUrl) {
      return NextResponse.json(
        { success: false, error: 'No image returned by model' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, imageDataUrl: editedDataUrl });
  } catch (error) {
    console.error('Google image edit error:', error);
    let message = 'Internal server error';
    if (error.message?.toLowerCase().includes('api') || error.message?.toLowerCase().includes('key')) {
      message = 'Authentication failed. Check GOOGLE_API_KEY.';
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

