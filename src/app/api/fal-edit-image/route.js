import { fal } from "@fal-ai/client";
import { NextResponse } from 'next/server';

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request) {
  try {
    const { prompt, imageDataUrl } = await request.json();

    // Validate input
    if (!prompt || !imageDataUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt or image data' },
        { status: 400 }
      );
    }

    // Submit job to Fal AI queue
    console.log('Submitting job to Fal AI...');
    const { request_id } = await fal.queue.submit("fal-ai/flux-pro/kontext", {
      input: {
        prompt: prompt.trim(),
        image_url: imageDataUrl
      }
    });

    console.log('Job submitted with request_id:', request_id);

    // Poll for completion
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes max (150 * 2 seconds)

    while (status !== 'COMPLETED' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;

      try {
        const statusResponse = await fal.queue.status("fal-ai/flux-pro/kontext", {
          requestId: request_id,
          logs: false
        });

        status = statusResponse.status;
        console.log(`Attempt ${attempts}: Status is ${status}`);

        if (status === 'FAILED') {
          return NextResponse.json(
            { success: false, error: 'Fal AI processing failed' },
            { status: 500 }
          );
        }
      } catch (statusError) {
        console.error('Error checking status:', statusError);
        // Continue polling on status check errors
      }
    }

    if (status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Processing timeout - please try again' },
        { status: 408 }
      );
    }

    // Get the result
    console.log('Getting result...');
    const result = await fal.queue.result("fal-ai/flux-pro/kontext", {
      requestId: request_id
    });

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      );
    }

    // Download the image and convert to base64
    const imageUrl = result.data.images[0].url;
    console.log('Downloading image from:', imageUrl);

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageDataUrlResult = `data:image/png;base64,${base64Image}`;

    console.log('Image processing completed successfully');

    return NextResponse.json({
      success: true,
      imageDataUrl: imageDataUrlResult,
      prompt: result.data.prompt
    });

  } catch (error) {
    console.error('Fal AI API error:', error);
    
    let errorMessage = 'Internal server error';
    if (error.message?.includes('API key')) {
      errorMessage = 'Invalid API key configuration';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error - please check your connection';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timeout - please try again';
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}