# DynaImg User and Technical Workflows

## Table of Contents
- [User Experience Workflows](#user-experience-workflows)
- [Technical Execution Flows](#technical-execution-flows)
- [Error Handling Workflows](#error-handling-workflows)
- [Performance Monitoring Workflows](#performance-monitoring-workflows)
- [Edge Cases and Special Scenarios](#edge-cases-and-special-scenarios)

## User Experience Workflows

### Primary User Journey: Tool Generation and Image Editing

**Scenario: User wants to create a custom brightness control**

#### Step-by-Step User Experience

**1. Initial Application State**


**2. Image Upload Workflow**
```bash
# User clicks "Upload Image"
# File picker opens with filters: JPEG, PNG, WEBP

User selects: vacation-photo.jpg (2.3MB, 1920x1080)
├── Validation: ✓ File type supported
├── Validation: ✓ File size OK (under 10MB)
├── Conversion: File → Base64 data URL
└── Result: Image displays in left panel
```

**3. Tool Generation Workflow**
```bash
# User types and sends tool request

User input: "create a brightness slider from -100 to +100"
├── Input validation: ✓ Not empty, under 500 chars
├── Message formatting: Add to conversation history
└── UI update: Show processing spinner in chat input

# System processes request in background
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │────│   API       │────│   Cerebras  │
│   sends     │    │   formats   │    │   LLM       │
│   request   │    │   and       │    │   generates │
└─────────────┘    └─────────────┘    └─────────────┘
                                        │
                                        ∨
                              Generates HTML/CSS/JS
```

**4. Tool Rendering Workflow**
```bash
# System receives LLM response with code

Response content: Contains:
├── JavaScript: Canvas manipulation functions
├── HTML: Slider input with values (-100 to +100)
├── CSS: dynaimg-* classes for styling

# Tool processing and integration
├── Process HTML: Extract scripts vs DOM elements
├── Sandbox execution: IIFE wrapping for security
├── Live DOM injection: dangerouslySetInnerHTML
└── Result: Interactive brightness slider appears

# Visual result
┌─────────────────┐ ┌─────────────────────────────┐
│ Image:          │ │ ToolBox                     │
│ [Current image] │ │ ┌─────────────────────────┐ │
│                 │ │ │ Brightness      -50%    │ │
│                 │ │ │ ────●─────────────────── │ │
│                 │ │ │ [-100]   [+100]         │ │
│                 │ │ └─────────────────────────┘ │
└─────────────────┘ └─────────────────────────────┘
```

**5. Tool Interaction Workflow**
```bash
# User interacts with brightness slider

User drags slider: -100 → 0 → +50
├── Real-time updates: Canvas pixel manipulation
├── Process flow:
│   ├── Slider oninput event fires
│   ├── Extract slider value (+50)
│   ├── Call processBrightness((+50 + 100) / 200) = 0.75
│   ├── Canvas pixel processing: Multiply by 0.75
│   └── Real-time visual feedback
└── Performance: 60fps smooth interaction

# Advanced interactions
├── Tool combines with other generated tools
├── Multiple simultaneous adjustments possible
├── Original image data preserved for non-destructive edits
└── Visual feedback with live preview
```

**6. Image Export Workflow**
```bash
# User completes edits and wants to save

User clicks: "Download" button (in TextAreaPanel)
├── Collect current canvas state
├── Convert: Canvas pixels → PNG data URL
├── Create: Invisible download link
├── Trigger: Browser download action
└── Result: edited-image-[timestamp].png saved locally
```

### Advanced User Scenarios

#### Multi-Tool Orchestration

**Scenario: Professional photo editing session**
```bash
User creates multiple tools:
├── Brightness slider (-100 to +100)
├── Contrast control (0.1x to 3.0x)
├── Saturation adjustment (-100% to +100%)
└── Hue shift slider (-180° to +180°)

# Interaction orchestration
├── Tools work on same canvas simultaneously
├── Real-time preview of combined effects
├── Adjustment stacking and layer management
└── Performance maintained at 60fps with all tools active
```

#### AI Image Editing Integration

**Scenario: Combining generated tools with AI editing**
```bash
# User workflow
├── Generate manual controls for precise adjustments
├── Use AI-powered edits for creative transformations
├── Combine both: Manual fine-tuning + AI enhancement
└── Seamless switching between modes

# Example session
1. Generate brightness tool → Adjust technical exposure
2. Generate sharpness tool → Fix focus issues
3. Use AI prompt: "transform into cinematic style"
4. Fine-tune AI result with generated color tools
5. Export final composite result
```

## Technical Execution Flows

### System Startup and Initialization Flow

**Application Boot Sequence**
```bash
# 1. Next.js hydration
├── Load: globals.css with design system
├── Load: Font preloads (Geist, Manrope)
├── Initialize: React root and providers
└── Mount: Context providers hierarchy

# 2. Context initialization
ImageProvider initialization:
├── createRef: canvasRef, currentImageRef, originalImageDataRef
├── build: canvasEditor stable API
├── setup: default state values
└── return: provider with value object

ToolProvider initialization:
├── createRef: executedScriptsRef, toolScriptsRef
├── bind: addTool, removeTool, processToolHtml functions
├── initialize: empty renderedTools array
└── return: provider with management API
```

**Component Mounting Flow**
```bash
# HomeContent component mount
├── ImageContext: ✓ Available, no image loaded
├── ToolContext: ✓ Available, no tools rendered
└── Page state: Ready for user interaction

# Component initialization order
1. page.js (Root) mounts first
2. HomeContent mounts with context access
3. ImagePanel renders with upload ready
4. TextAreaPanel prepares for AI editing
5. ToolCanvas shows empty state
6. SimpleChatInput initializes message history

# Memory allocation estimation
├── Image data: Up to 50MB for large images
├── Canvas contexts: ~10MB GPU memory
├── Tool code: ~5MB for multiple generated tools
└── Total: ~65MB typical usage
```

### Tool Generation Technical Flow

**Complete Request-to-Render Pipeline**
```javascript
// Phase 1: User Input Processing
const handleSendMessage = async () => {
  // 1. Input validation and formatting
  if (!inputValue.trim() || isLoading) return;

  // 2. UI feedback: Show loading state
  setIsLoading(true);

  // 3. Message preparation
  const userMessage = {
    role: 'user',
    content: inputValue.trim()
  };
  const updatedMessages = [...messages, userMessage];

  // 4. Clear input field
  setInputValue(''); // User sees immediate feedback
  setMessages(updatedMessages);

  // 5. Forward messages to API
  await executeToolGeneration(updatedMessages);
};

// Phase 2: API Request Flow
const executeToolGeneration = async (messages) => {
  try {
    const response = await fetch('/api/generate-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        // Optional: additional parameters
        temperature: 0,
        maxTokens: 4000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    // 6. Process successful response
    await processGeneratedTool(data.content);

  } catch (error) {
    // 7. Error handling and user notification
    console.error('Tool generation failed:', error);
  } finally {
    // 8. Reset UI loading state
    setIsLoading(false);
  }
};
```

**Tool Processing and Integration Flow**
```javascript
const processGeneratedTool = async (content) => {
  // 1. Extract code blocks from LLM response
  const codeBlocks = extractCodeBlocks(content);

  if (codeBlocks.length === 0) {
    throw new Error('No code blocks found in response');
  }

  // 2. Select largest/most appropriate code block
  const selectedCode = findLargestCodeBlock(codeBlocks);

  // 3. Use ToolContext to process and render
  await ToolContext.addTool(selectedCode.code);

  // 4. ToolContext processing sequence:
  //    3.1 HTML parsing and script extraction
  //    3.2 Generate tool object with unique ID
  //    3.3 IIFE-wrapping for security
  //    3.4 Add to rendered tools array
  //    3.5 Inject into DOM via dangerouslySetInnerHTML
  //    3.6 Execute isolated JavaScript

  // 5. UI updates automatically via React context
  //    (Subscribers to ToolContext receive updated tools)

  // 6. Performance optimization
  requestAnimationFrame(() => {
    // Ensure smooth rendering of new tool
    lucide.createIcons(); // Update any icons
  });
};
```

### Canvas Image Processing Flow

**Real-time Pixel Manipulation Pipeline**
```javascript
// Canvas manipulation sequence for brightness adjustment
const processBrightness = (value) => {
  // 1. Bounds checking
  const brightnessValue = Math.max(-1, Math.min(1, value));

  // 2. Canvas access
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // 3. Image data acquisition
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // 4. Pixel processing loop (cache-optimized)
  const adjustment = brightnessValue * 255;
  const length = pixels.length;

  for (let i = 0; i < length; i += 4) {
    // Red channel: Clamp to 0-255 range
    pixels[i] = Math.max(0, Math.min(255, pixels[i] + adjustment));

    // Green channel
    pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + adjustment));

    // Blue channel
    pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + adjustment));

    // Alpha channel: Preserve original transparency
    // pixels[i + 3] remains unchanged
  }

  // 5. Canvas update with optimized timing
  ctx.putImageData(imageData, 0, 0);

  // 6. Performance: 60fps target
  // Full HD image (1920x1080) = 2M pixels = 8M operations
  // Modern GPU: Processes in ~16ms (60fps capability)
};
```

### AI Image Editing Technical Flow

**Fal AI Integration Sequence**
```javascript
const performAiImageEdit = async (prompt, imageDataUrl) => {
  // Phase 1: Request validation
  if (!prompt?.trim()) {
    throw new Error('Prompt is required');
  }
  if (!imageDataUrl?.startsWith('data:image/')) {
    throw new Error('Valid image data URL required');
  }

  // Phase 2: UI feedback
  setIsProcessing(true);
  setStatus('Sending to AI...');

  // Phase 3: API submission
  const { request_id } = await fal.queue.submit(
    "fal-ai/flux-pro/kontext",
    {
      input: {
        prompt: prompt.trim(),
        image_url: imageDataUrl
      }
    }
  );

  // Phase 4: Queue polling
  const result = await pollForCompletion(request_id);

  // Phase 5: Result processing
  if (result?.data?.images?.length > 0) {
    const imageUrl = result.data.images[0].url;

    // Phase 6: Image download and conversion
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Phase 7: Canvas update
    const newImageDataUrl = `data:image/png;base64,${base64Image}`;
    updateCanvasImage(newImageDataUrl);

    // Phase 8: Success feedback
    setStatus('Image edited successfully!');
    setTimeout(() => setStatus(''), 3000);
  }
};
```

## Error Handling Workflows

### Client-Side Error Scenarios

**Network Failure Recovery**
```javascript
const resilientApiCall = async (apiFunction, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    backoffMultiplier = 2
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiFunction();
      return result;

    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Final attempt failed
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));

      console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
    }
  }
};
```

**Graceful Degradation Strategy**
```javascript
const handleApiFailure = (error, context) => {
  // Determine failure type and recovery strategy
  switch (error.type) {
    case 'NETWORK_ERROR':
      // Offline mode: Load cached tools or show demo
      return showOfflineMode();

    case 'API_QUOTA_EXCEEDED':
      // Show quota exceeded message with upgrade option
      return showQuotaExceeded();

    case 'TOOL_GENERATION_FAILED':
      // Fallback: Show generic tools or retry option
      return showGenericTools();

    case 'IMAGE_PROCESSING_FAILED':
      // Preserve original image, show error details
      return handleImageProcessingError();

    default:
      // Generic error handling
      return showGenericError(error.message);
  }
};
```

### Server-Side Error Recovery

**API Route Error Handling**
```javascript
export async function POST(request) {
  try {
    // Main processing logic
    const result = await processRequest(request);
    return NextResponse.json(result);

  } catch (error) {
    // Error classification and response
    const errorResponse = classifyError(error);

    // Log structured error information
    console.error('API Error:', {
      error: error.message,
      stack: error.stack,
      request: await request.clone().json(),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    // Return appropriate HTTP status and message
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.userMessage
      },
      { status: errorResponse.httpStatus }
    );
  }
};
```

## Performance Monitoring Workflows

### Real-time Performance Tracking

**Canvas Performance Metrics**
```javascript
const performanceMonitor = {
  frameCount: 0,
  lastFrameTime: performance.now(),
  canvasPerformance: {
    pixelOperations: 0,
    renderTime: 0,
    memoryUsage: 0
  },

  trackFrame: () => {
    const currentTime = performance.now();
    const deltaTime = currentTime - performanceMonitor.lastFrameTime;

    if (deltaTime >= 16.67) { // ~60fps threshold
      performanceMonitor.frameCount++;

      if (performanceMonitor.frameCount % 60 === 0) {
        // Calculate FPS every second
        const fps = 1000 / deltaTime;
        performanceMonitor.logPerformance(fps);
      }
    }

    performanceMonitor.lastFrameTime = currentTime;
  },

  trackPixelOperation: (operation, pixelsProcessed, duration) => {
    performanceMonitor.canvasPerformance.pixelOperations += pixelsProcessed;
    performanceMonitor.canvasPerformance.renderTime += duration;

    if (pixelsProcessed > 1000000) { // Warn for large operations
      console.warn(`Large pixel operation: ${operation} (${pixelsProcessed} pixels, ${duration}ms)`);
    }
  },

  logPerformance: (fps) => {
    console.debug(`Performance: ${fps.toFixed(2)} FPS`, {
      renderTime: performanceMonitor.canvasPerformance.renderTime,
      pixelOperations: performanceMonitor.canvasPerformance.pixelOperations
    });
  }
};
```

### Memory Usage Monitoring

**Canvas Memory Tracking**
```javascript
const memoryMonitor = {
  canvasMemory: 0,
  maxCanvasSize: 0,

  trackCanvasMemory: (width, height, pixelDepth = 4) => {
    // Calculate estimated memory usage
    const pixels = width * height;
    const bytesPerPixel = pixelDepth; // RGBA = 4 bytes
    const canvasBytes = pixels * bytesPerPixel;

    memoryMonitor.canvasMemory = canvasBytes;
    memoryMonitor.maxCanvasSize = Math.max(memoryMonitor.maxCanvasSize, canvasBytes);

    // Warn if exceeding recommended limits
    if (canvasBytes > 50 * 1024 * 1024) { // 50MB
      console.warn(`Large canvas detected: ${(canvasBytes / 1024 / 1024).toFixed(1)}MB`);
    }
  },

  getMemoryReport: () => ({
    canvasMemoryMB: (memoryMonitor.canvasMemory / 1024 / 1024).toFixed(2),
    maxCanvasSizeMB: (memoryMonitor.maxCanvasSize / 1024 / 1024).toFixed(2),
    recommendedLimit: '50MB',
    status: memoryMonitor.canvasMemory > 50 * 1024 * 1024 ? 'WARNING' : 'OK'
  })
};
```

### API Performance Monitoring

**Request Timing and Analytics**
```javascript
const apiPerformance = {
  requests: [],

  trackRequest: (endpoint, startTime, endTime, status) => {
    const duration = endTime - startTime;
    const requestInfo = {
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    apiPerformance.requests.push(requestInfo);

    // Alert for slow requests
    if (duration > 5000) { // 5 seconds
      console.warn(`Slow API request: ${endpoint} took ${duration}ms`);
    }
  },

  getPerformanceReport: () => {
    const recentRequests = apiPerformance.requests.slice(-100); // Last 100 requests

    return {
      totalRequests: recentRequests.length,
      averageDuration: recentRequests.reduce((acc, req) => acc + req.duration, 0) / recentRequests.length,
      successRate: recentRequests.filter(req => req.status >= 200 && req.status < 300).length / recentRequests.length,
      slowestRequest: recentRequests.reduce((max, req) => req.duration > max.duration ? req : max)
    };
  }
};
```

## Edge Cases and Special Scenarios

### File Handling Edge Cases

**Large Image Processing**
```bash
# Scenario: User uploads 50MB 8K image
├── Frontend: File validation (✓ under size limit)
├── Browser: Conversion to Base64 (~67MB string)
├── Canvas: Context creation with willReadFrequently=true
├── Memory: Leaves room for processing operations
└── Performance: Warning displayed for slow operations

# Optimizations for large images:
├── Progressive rendering during load
├── Sub-sampling for preview operations
├── Memory warnings for high-res edits
└── Chunked processing for pixel operations
```

**Unsupported File Types**
```bash
# Scenario: User uploads .tiff file
├── File validation: Detect unsupported type
├── Error display: "Please use JPEG, PNG, or WEBP"
├── Fallback: Suggest conversion or alternative upload
└── Recovery: Clear file input and await valid selection
```

### Network Failure Scenarios

**Complete Offline Mode**
```bash
# Scenario: Network connection lost mid-session
├── Detect: Network monitoring with retry logic
├── Cache: Store current image state locally
├── Queue: Buffer pending AI requests
├── Fallback: Allow local-only tool interactions
└── Sync: Automatically retry when connection restored
```

**API Rate Limiting**
```bash
# Scenario: User hits API limits
├── Preempt: Local estimate of remaining API quota
├── Graceful: Queue requests with intelligent scheduling
├── Warning: Show clear error message with time remaining
└── Recovery: Suggest premium upgrade or wait period
```

### Memory and Performance Edge Cases

**Memory Pressure Handling**
```bash
# Scenario: System running low on memory
├── Monitor: Regular memory usage checks
├── Cleanup: Dispose unused canvas contexts
├── Optimize: Reduce image quality temporarily
└── Alert: Warn user about memory usage

# Recovery strategies:
├── Progressive memory cleanup
├── Smaller canvas operations
├── Cached processing results
└── User-guided memory management
```

**Browser Compatibility Issues**
```javascript
// Detect and handle browser differences
const browserCapabilities = {
  checkCanvasSupport: () => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  },

  checkWebGLSupport: () => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('webgl'));
  },

  getOptimalCanvasSettings: () => ({
    willReadFrequently: browserCapabilities.isFirefoxLike(), // Firefox-specific optimization
    alpha: true,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high' // Not supported in some browsers
  })
};
```

### Multi-User and Session Scenarios

**Session Persistence**
```javascript
// Handle browser refresh/navigations
const sessionManager = {
  saveSession: () => {
    const sessionData = {
      selectedImage: selectedImage,
      generatedTools: renderedTools.map(tool => ({
        id: tool.id,
        code: toolScriptsRef.current.get(tool.id),
        settings: tool.currentSettings
      })),
      timestamp: Date.now()
    };
    localStorage.setItem('dynaimg-session', JSON.stringify(sessionData));
  },

  restoreSession: () => {
    const saved = localStorage.getItem('dynaimg-session');
    if (saved) {
      const sessionData = JSON.parse(saved);
      // Restore image and tools with validation
      if (sessionData.selectedImage) {
        loadImageToCanvas(sessionData.selectedImage);
      }
      // Restore tool configurations...
    }
  }
};
```

This comprehensive workflow documentation demonstrates how DynaImg seamlessly integrates user experience design with complex AI-powered image processing, providing both intuitive interaction patterns and robust technical execution while maintaining high performance and reliability across diverse usage scenarios.