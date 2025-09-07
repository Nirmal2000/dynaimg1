# DynaImg API Integration Architecture

## Table of Contents
- [API Architecture Overview](#api-architecture-overview)
- [Cerebras LLM Integration](#cerebras-llm-integration)
- [Fal AI Integration](#fal-ai-integration)
- [Request/Response Patterns](#requestresponse-patterns)
- [Error Handling and Recovery](#error-handling-and-recovery)
- [Performance Optimization](#performance-optimization)
- [Security and Rate Limiting](#security-and-rate-limiting)

## API Architecture Overview

### Dual-API Ecosystem

**DynaImg** integrates two specialized AI services:

**Cerebras API (Tool Generation)**
- **Provider**: `qwen-3-coder-480b` model
- **Purpose**: Conversational code generation
- **Use Case**: Transforming natural language to UI components
- **Integration**: LangChain framework with Next.js API routes

**Fal AI API (Image Processing)**
- **Provider**: `fal-ai/flux-pro/kontext` model
- **Purpose**: Generative image manipulation
- **Use Case**: AI-powered image editing and transformations
- **Integration**: RESTful API with queue management

### API Coordination Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Request  │    │   Cerebras      │    │   ToolCanvas    │
│                 │ ── │   LLM API       │ ── │   Renders       │
│ Generate Tool   │    │   Generates     │    │   Component     │
│                 │    │   HTML/CSS/JS   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                    │
                                    ∨
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tool          │    │   User Input    │    │   Fal AI        │
│   Interacts     │ ── │   (edit image)  │ ── │   API           │
│   with Canvas   │    │                 │    │   Processes     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                    │
                                    ∨
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Queue         │    │   Image         │    │   Update        │
│   Polling       │ ── │   Download      │ ── │   Canvas        │
│   Status        │    │                 │    │   with Result   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Cerebras LLM Integration

### Model Configuration and Setup

**LangChain-Next.js Integration:**
```javascript
// src/app/api/generate-tool/route.js
import { ChatCerebras } from '@langchain/cerebras';

// Model initialization
const llm = new ChatCerebras({
  model: process.env.MODEL_NAME || "qwen-3-coder-480b",
  temperature: 0, // Deterministic output for UI consistency
  // Additional configuration options
  maxTokens: 4000, // Allow sufficient code generation
  streaming: false, // Batch processing for reliability
});
```

**Environment Configuration:**
```bash
# Required environment variables
MODEL_NAME="qwen-3-coder-480b"
CEREBRAS_API_KEY="your-api-key-here"

# Optional configurations
TEMPERATURE=0
MAX_TOKENS=4000
```

### System Prompt Architecture

**Prompt Loading Strategy:**
```javascript
// Dynamic system prompt loading
const getSystemPrompt = () => {
  try {
    const promptPath = join(process.cwd(), 'system-prompt.txt');
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Failed to load system prompt:', error);
    // Fallback prompt for resilience
    return getFallbackPrompt();
  }
};
```

**Fallback Prompt Strategy:**
```javascript
const getFallbackPrompt = () => `
You are a helpful coding assistant. When a user asks for a tool or code,
provide clean, working code examples. Focus on practical, implementable
solutions. Always respond with complete, self-contained HTML/CSS/JavaScript
code when appropriate.

# Key Requirements:
- Provide complete code examples
- Ensure code is ready to use
- Include necessary error handling
- Focus on performance and reliability
`;
```

### Request Processing Pipeline

**Message Formatting and Invocation:**
```javascript
export async function POST(request) {
  try {
    const { messages } = await request.json();

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Construct LangChain message format
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

    // Invoke LLM with context
    console.log('Invoking Cerebras LLM with', langchainMessages.length, 'messages');
    const response = await llm.invoke(langchainMessages);

    // Return processed response
    return NextResponse.json({
      content: response.content,
      usage: response.usage, // Token usage information
      model: response.model // Model information
    });

  } catch (error) {
    console.error('Cerebras API error:', error);
    return handleCerebrasError(error);
  }
}
```

**Error Handling Strategy:**
```javascript
const handleCerebrasError = (error) => {
  // Error classification and user-friendly responses
  if (error.message?.includes('API key')) {
    return NextResponse.json(
      { error: 'Authentication failed. Please check API key.' },
      { status: 401 }
    );
  }

  if (error.message?.includes('rate limit')) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60
      },
      { status: 429 }
    );
  }

  if (error.message?.includes('context length')) {
    return NextResponse.json(
      { error: 'Message too long. Please shorten your request.' },
      { status: 413 }
    );
  }

  // Generic error response
  return NextResponse.json(
    { error: 'Service temporarily unavailable. Please try again.' },
    { status: 500 }
  );
};
```

## Fal AI Integration

### Fal AI Client Configuration

**SDK Initialization:**
```javascript
// src/app/api/fal-edit-image/route.js
import { fal } from "@fal-ai/client";

// Global configuration
fal.config({
  credentials: process.env.FAL_KEY, // Required: Fal AI API key
  // Additional configuration
  requestTimeout: 30000, // 30 second timeout
  retryConfig: {
    maxAttempts: 3,
    backoffMultiplier: 2
  }
});

// Environment requirements
FAL_KEY="your-fal-ai-api-key"
FAL_TIMEOUT=30000
```

### Image Queue Processing Architecture

**Queue-Based Processing Pattern:**
```javascript
export async function POST(request) {
  try {
    const { prompt, imageDataUrl } = await request.json();

    // Input validation
    if (!prompt || !imageDataUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing prompt or image data' },
        { status: 400 }
      );
    }

    // Submit to Fal queue system
    console.log('Submitting edit job to Fal AI...');
    const { request_id } = await fal.queue.submit("fal-ai/flux-pro/kontext", {
      input: {
        prompt: prompt.trim(), // Clean user input
        image_url: imageDataUrl, // Base64 or URL format
        // Optional parameters
        seed: Math.floor(Math.random() * 1000000), // Random seed for consistency
        strength: 0.8, // Edit intensity (0-1)
        sync_mode: true, // Synchronous processing
      }
    });

    console.log('Job submitted with request_id:', request_id);

    // Begin polling
    return await pollForCompletion(request_id);

  } catch (error) {
    console.error('Fal API submission error:', error);
    return handleFalError(error);
  }
}
```

### Queue Polling and Status Management

**Polling Strategy:**
```javascript
const pollForCompletion = async (requestId) => {
  const maxAttempts = 150; // 5 minutes maximum
  const pollInterval = 2000; // 2 seconds between polls

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check job status
      const statusResponse = await fal.queue.status(
        "fal-ai/flux-pro/kontext",
        {
          requestId: requestId,
          logs: false // Disable verbose logging
        }
      );

      const { status, logs } = statusResponse;

      console.log(`Attempt ${attempt + 1}: Status is ${status}`);

      // Handle different status states
      switch (status) {
        case 'COMPLETED':
          return await handleCompleted(requestId);

        case 'FAILED':
          return NextResponse.json(
            { success: false, error: 'AI processing failed' },
            { status: 500 }
          );

        case 'IN_PROGRESS':
          // Continue polling
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          break;

        default:
          console.warn(`Unexpected status: ${status}`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

    } catch (pollError) {
      console.error('Polling error:', pollError);
      // Continue polling on errors
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  // Timeout handling
  return NextResponse.json(
    { success: false, error: 'Processing timeout - please try again' },
    { status: 408 }
  );
};
```

### Result Processing and Image Download

**Completion Handler:**
```javascript
const handleCompleted = async (requestId) => {
  try {
    // Retrieve final result
    console.log('Retrieving completed job result...');
    const result = await fal.queue.result("fal-ai/flux-pro/kontext", {
      requestId: requestId
    });

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      );
    }

    // Extract image URL
    const imageUrl = result.data.images[0].url;
    console.log('Processing result image:', imageUrl);

    // Download and convert to base64
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error('Failed to download processed image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Return standardized format
    return NextResponse.json({
      success: true,
      imageDataUrl: `data:image/png;base64,${base64Image}`,
      prompt: result.data.prompt,
      metadata: {
        model: 'fal-ai/flux-pro/kontext',
        requestId: requestId,
        processingTime: result.data.processing_time || null
      }
    });

  } catch (completionError) {
    console.error('Result processing error:', completionError);
    return NextResponse.json(
      { success: false, error: 'Error processing result' },
      { status: 500 }
    );
  }
};
```

## Request/Response Patterns

### Standardized API Response Format

**Success Response Template:**
```json
{
  "success": true,
  "data": { /* domain-specific response */ },
  "metadata": {
    "timestamp": "2025-01-01T12:00:00.000Z",
    "model": "qwen-3-coder-480b",
    "tokensUsed": 2340,
    "processingTime": 1.2
  },
  "cache": {
    "cached": false,
    "cacheKey": null
  }
}
```

**Error Response Template:**
```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": { /* optional technical details */ },
  "retryable": true,
  "retryAfter": 60
}
```

### Client-Side Integration Patterns

**Cerebras Client Integration:**
```javascript
// Tool generation client
const generateTool = async (messages) => {
  const response = await fetch('/api/generate-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages,
      // Optional parameters
      temperature: 0.7,
      maxTokens: 2000
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Tool generation failed');
  }

  return result.content;
};
```

**Fal AI Client Integration:**
```javascript
// Image editing client
const editImage = async (prompt, imageDataUrl) => {
  const response = await fetch('/api/fal-edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt,
      imageDataUrl: imageDataUrl,
      // Optional parameters
      strength: 0.8,
      style: 'realistic'
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Image editing failed');
  }

  return result;
};
```

## Error Handling and Recovery

### Comprehensive Error Classification

**Authentication Errors:**
```javascript
if (error.message?.includes('API key') || error.code === 'INVALID_API_KEY') {
  // Handle authentication issues
  console.error('API authentication failed');
  // Prompt user to check configuration
  // Fallback to cached/offline mode if available
}
```

**Rate Limiting:**
```javascript
if (error.code === 'RATE_LIMIT_EXCEEDED') {
  const retryAfter = error.retryAfter || 60;
  // Implement exponential backoff
  console.warn(`Rate limited. Retrying in ${retryAfter}s`);
  setTimeout(() => retryRequest(), retryAfter * 1000);
}
```

**Network and Timeout Errors:**
```javascript
if (error.name === 'NetworkError' || error.code === 'TIMEOUT') {
  // Implement retry logic
  if (retryCount < maxRetries) {
    retryCount++;
    setTimeout(() => executeWithRetry(), exponentialBackoff(retryCount));
  } else {
    throw new Error('Network request failed after multiple attempts');
  }
}
```

### Graceful Degradation Strategies

**Service Failure Handling:**
```javascript
const executeWithFallback = async (primaryFunction, fallbackFunction) => {
  try {
    return await primaryFunction();
  } catch (error) {
    console.warn('Primary service failed, attempting fallback:', error.message);

    try {
      return await fallbackFunction();
    } catch (fallbackError) {
      console.error('Both primary and fallback services failed');
      throw new Error('Service unavailable');
    }
  }
};
```

**Offline/Cached Mode:**
```javascript
// Implement cache-first strategy
const cacheFirst = async (request) => {
  // Check local cache first
  const cachedResponse = await getFromCache(request.cacheKey);

  if (cachedResponse) {
    // Return stale cache while refreshing
    refreshCacheAsync(request);
    return cachedResponse;
  }

  // Fetch fresh response
  const response = await fetchFromAPI(request);
  await saveToCache(request.cacheKey, response);

  return response;
};
```

### Error Monitoring and Logging

**Structured Error Reporting:**
```javascript
const reportError = (error, context) => {
  const errorReport = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context: {
      userId: context.userId,
      sessionId: context.sessionId,
      request: context.request,
      userAgent: context.userAgent
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      apiVersion: 'v1.0.0'
    }
  };

  // Log locally
  console.error('Error report:', JSON.stringify(errorReport, null, 2));

  // Send to monitoring service (if configured)
  if (process.env.ERROR_REPORTING_ENDPOINT) {
    sendToMonitoring(errorReport);
  }
};
```

## Performance Optimization

### Response Time Optimization

**Parallel Processing:**
```javascript
const processParallelRequests = async (requests) => {
  // Batch similar requests to reduce overhead
  const batchedRequests = batchByEndpoint(requests);

  const promises = batchedRequests.map(async (batch) => {
    if (batch.length === 1) {
      return await processRequest(batch[0]);
    }

    // Process batch in parallel
    return await Promise.all(
      batch.map(request => processRequest(request))
    );
  });

  return await Promise.all(promises);
};
```

### Caching Strategy

**Multiple Cache Layers:**
```javascript
// API level caching
const apiCache = new Map();

// Session level caching
const sessionCache = sessionStorage;

// Application level caching
const memoryCache = new LRUCache({ max: 100 });

// Cache hierarchy check
const getWithCaching = async (key) => {
  // Check application cache
  let result = memoryCache.get(key);
  if (result) return result;

  // Check session cache
  result = sessionCache.getItem(key);
  if (result) return JSON.parse(result);

  // Fetch and cache
  result = await fetchFromAPI(key);
  memoryCache.set(key, result);
  sessionCache.setItem(key, JSON.stringify(result));

  return result;
};
```

### Bandwidth Optimization

**Response Compression:**
```javascript
// Automatic response compression
const compressedResponse = (data) => {
  const jsonString = JSON.stringify(data);
  const compressed = gzipSync(jsonString);

  return new Response(compressed, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip'
    }
  });
};
```

**Selective Data Loading:**
```javascript
// Load minimal required data
const getMinimalToolSpec = (fullSpec) => ({
  id: fullSpec.id,
  type: fullSpec.type,
  name: fullSpec.name,
  icon: fullSpec.icon,

  // Lazy load full specification
  getFullSpec: () => fullSpec
});
```

## Security and Rate Limiting

### Authentication and Authorization

**API Key Management:**
```javascript
// Secure key validation
const validateApiKey = (key) => {
  // Check key format and validity
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Validate against expected format
  const keyPattern = /^[A-Za-z0-9_-]{20,}$/;
  return keyPattern.test(key);
};

// Environment variable validation
const initializeApiClients = () => {
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const falKey = process.env.FAL_KEY;

  if (!validateApiKey(cerebrasKey)) {
    throw new Error('Invalid or missing CEREBRAS_API_KEY');
  }

  if (!validateApiKey(falKey)) {
    throw new Error('Invalid or missing FAL_KEY');
  }

  // Initialize clients with validated keys
};
```

### Rate Limiting Implementation

**Token Bucket Implementation:**
```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed = (identifier) => {
    const now = Date.now();

    // Remove expired requests
    this.requests = this.requests.filter(
      request => (now - request.timestamp) < this.windowMs
    );

    // Check if within limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push({ identifier, timestamp: now });
      return true;
    }

    return false;
  };
}

// Global rate limiter
const globalLimiter = new RateLimiter(100, 60000); // 100 requests per minute
```

### Request Sanitization and Validation

**Input Sanitization:**
```javascript
const sanitizeInput = (input) => {
  // Remove potentially harmful content
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  // Length validation
  if (sanitized.length > 10000) { // 10KB limit
    throw new Error('Input too long');
  }

  // Encode special characters
  return encodeURIComponent(sanitized);
};
```

**File Upload Validation:**
```javascript
const validateImageUpload = (file) => {
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }

  // Size validation (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large');
  }

  // Image dimension validation
  if (file.width && file.height) {
    if (file.width > 4096 || file.height > 4096) {
      throw new Error('Image dimensions too large');
    }
  }
};
```

This comprehensive API integration architecture ensures reliable, secure, and performant communication between DynaImg's frontend and the various AI services while maintaining user experience quality and system stability.