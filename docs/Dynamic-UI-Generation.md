# DynaImg Dynamic UI Generation System

## Table of Contents
- [Core Innovation: Conversational UI Synthesis](#core-innovation-conversational-ui-synthesis)
- [System Prompt Architecture](#system-prompt-architecture)
- [OpenRouter LLM Integration](#openrouter-llm-integration)
- [HTML/CSS/JS Processing Pipeline](#htmlcssjs-processing-pipeline)
- [Tool Execution and Security](#tool-execution-and-security)
- [Canvas Integration Patterns](#canvas-integration-patterns)
- [Performance Optimization](#performance-optimization)

## Core Innovation: Conversational UI Synthesis

### The Transformational Concept

**DynaImg** revolutionizes software interaction by enabling users to "write their own applications" through natural language conversations. Instead of learning complex programming languages or using rigid drag-and-drop interfaces, users simply describe what they need.

### The "What You Say is What You Get" Paradigm

```
User Input:         "create a brightness slider from -100 to +100"
Direct Result:      → Instant interactive slider component
Traditional Way:    Learn React + CSS + State Management + Canvas API
```

### Technical Breakthrough: AI as Compiler

DynaImg treats Large Language Models as "living compilers" that:
- **Convert natural language into executable UI code**
- **Maintain perfect consistency with established design systems**
- **Generate fully-functional, production-ready components**
- **Integrate seamlessly into existing application architecture**

## System Prompt Architecture

### 440-Line Master Specification

The system prompt (`system-prompt.txt`) serves as the "constitution" of UI generation, containing:

**1. Technical Specifications:**
```typescript
// Explicit tool generation requirements
- Complete HTML/CSS/JS self-contained components
- Direct Canvas access: document.querySelector('canvas')
- Lucide icon integration: lucide.createIcons()
- Design class compliance: dynaimg-* system
```

**2. Design System Integration:**
```css
/* Mandatory styling patterns */
.dynaimg-section-spacing { margin-bottom: 1.25vw; }
.dynaimg-slider-container { display: flex; justify-content: space-between; }
.dynaimg-slider { /* Custom styling */ }
```

**3. Performance Requirements:**
```javascript
// Direct hardware acceleration patterns
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
```

### Prompt Engineering Strategy

**Teaching AI the Design System:**
- **Complete specification** - Every component pattern is defined
- **Code examples** - Functional samples for each pattern
- **Styling mandates** - Mandatory CSS class usage
- **Performance standards** - Canvas access patterns with optimization

**Scalability Approach:**
- **Extensible patterns** - New component types added via prompt updates
- **Consistency enforcement** - Every generation follows identical patterns
- **Quality assurance** - Built-in testing and validation feedback

## OpenRouter LLM Integration

### Model Selection and Configuration

**Why google/gemini-2.5-flash via OpenRouter:**
```javascript
const llm = new ChatOpenAI(
  {
    model: 'google/gemini-2.5-flash', // Advanced multimodal model
    temperature: 0.8, // Creative output for UI design
    streaming: true, // Enable real-time responses
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  {
    baseURL: "https://openrouter.ai/api/v1",
  }
);
```

**Key Selection Criteria:**
- **Multimodal Capabilities**: Can process both text and images for UI generation
- **Creativity**: Higher temperature enables innovative UI design solutions
- **Streaming Support**: Real-time streaming responses for better user experience
- **Accessibility**: OpenRouter provides access to multiple high-quality models

### API Integration Pipeline

**Request Flow:**
```typescript
// User input processing
const userMessage = { role: 'user', content: 'create brightness control' };
const systemPrompt = await getSystemPrompt(); // Load 440-line specification

// LangChain integration
const langchainMessages = [
  { role: "system", content: systemPrompt },
  userMessage
];

const response = await llm.invoke(langchainMessages);
return response.content; // HTML/CSS/JS tool definition
```

**Message Context Management:**
```typescript
// Maintain conversation history
const updatedMessages = [
  ...conversationHistory,
  userMessage
];
// Send complete context for smart tool generation
const response = await fetch('/api/generate-tool', {
  body: JSON.stringify({ messages: updatedMessages })
});
```

### Error Handling and Recovery

**LLM Response Validation:**
```typescript
// Ensure proper code block extraction
const codeBlocks = extractCodeBlocks(response.content);
const largestBlock = findLargestCodeBlock(codeBlocks);

if (largestBlock) {
  // Valid tool generated
  await addTool(largestBlock.code);
} else {
  // Fallback handling
  console.error('No valid code blocks found');
}
```

## HTML/CSS/JS Processing Pipeline

### Multi-Stage Processing Algorithm

**Stage 1: HTML Structure Analysis**
```javascript
function processToolHtml(code, toolId) {
  // 1. Extract JavaScript blocks
  const scriptMatches = code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  const jsCode = scriptMatches?.map(match => match[1]) || '';

  // 2. Remove scripts from HTML
  const htmlWithoutScripts = code.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // 3. Process complete HTML documents vs fragments
  return (htmlWithoutScripts.includes('<html')) ?
    processCompleteHtml(htmlWithoutScripts, jsCode, toolId) :
    processHtmlFragment(htmlWithoutScripts, jsCode, toolId);
}
```

**Stage 2: Content Extraction**
```javascript
function processCompleteHtml(fullHtml, jsCode, toolId) {
  // Parse complete HTML document
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, 'text/html');

  // Extract components
  const stylesFromHead = Array.from(doc.querySelectorAll('style'))
    .map(style => style.innerHTML);

  const bodyContent = doc.body.innerHTML;

  // Generate integrated HTML fragment
  return generateIntegratedFragment(stylesFromHead, bodyContent, jsCode, toolId);
}
```

**Stage 3: Fragment Processing**
```javascript
function processHtmlFragment(fragment, jsCode, toolId) {
  // Add integration wrapper
  return `
    <style>
      /* Integration styles */
      * { box-sizing: border-box; }
      ${getGlobalStyles()}
    </style>
    ${fragment}
    <script>
      // Execute in isolated context
      ${executeInSandbox(jsCode, toolId)}
    </script>
  `;
}
```

### Script Isolation and Execution

**IIFE (Immediately Invoked Function Expression) Sandbox:**
```javascript
// Original LLM-generated code
function processBrightness(value) {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  // Direct canvas manipulation
}

// Sandbox wrapper
const wrappedCode = `(function() {
  // LLM code injected here
  function processBrightness(value) {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    // Direct canvas manipulation
  }
})();`;

// Execute safely
eval(wrappedCode); // Runtime execution
```

**Execution Tracking System:**
```javascript
const executedScriptsRef = useRef(new Set());
const toolScriptsRef = useRef(new Map());

// Prevent duplicate script execution
if (!executedScriptsRef.current.has(toolId)) {
  executedScriptsRef.current.add(toolId);
  setTimeout(() => eval(executeCode), 100);
}
```

## Tool Execution and Security

### Runtime Security Architecture

**Isolation Mechanisms:**
1. **Scope Isolation**: Each tool executes in separate IIFE context
2. **DOM Isolation**: Prevents manipulation of parent application
3. **Execution Tracking**: Prevents duplicate script loading
4. **Error Containment**: Individual tool failures don't affect others

### Security Implementation

**Safe Function Wrapping:**
```javascript
function withSecurityWrapper(userCode) {
  return `
    (function() {
      try {
        ${userCode}
      } catch (error) {
        console.error('Tool execution error:', error);
        // Graceful error handling
        return false;
      }
    })()
  `;
}
```

**Access Control:**
```javascript
// Explicitly allowed global access
const SAFE_GLOBALS = [
  'document', 'window', 'canvas', 'console',
  'querySelector', 'getContext', 'getImageData'
];

// Block dangerous operations
const BLOCKED_OPERATIONS = [
  'eval', 'Function', 'setTimeout', 'setInterval',
  'XMLHttpRequest', 'fetch' // Except for allowed internal calls
];
```

### Error Handling Strategies

**Graceful Degradation:**
```javascript
function executeWithErrorHandling(toolId, code) {
  try {
    const result = eval(executeCode);
    if (!result) throw new Error('Tool execution failed');
    markToolAsActive(toolId);
  } catch (error) {
    console.error(`Tool ${toolId} failed:`, error);
    removeFailedTool(toolId);
    showUserFriendlyError(error.message);
  }
}
```

## Canvas Integration Patterns

### Direct Canvas Access Architecture

**Core Pattern: Zero-Abstraction Rendering**
```javascript
// DynaImg pattern - Direct hardware acceleration
function applyImageFilter(filterParams) {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Direct pixel manipulation
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Apply filter algorithm
  for (let i = 0; i < pixels.length; i += 4) {
    const red = pixels[i];
    const green = pixels[i + 1];
    const blue = pixels[i + 2];

    // Process pixel values
    pixels[i] = applyRedFilter(red);
    pixels[i + 1] = applyGreenFilter(green);
    pixels[i + 2] = applyBlueFilter(blue);
  }

  // Render result
  ctx.putImageData(imageData, 0, 0);
}
```

### Performance Optimization Strategies

**Memory Management:**
```javascript
// Optimized context creation
const ctx = canvas.getContext('2d', {
  willReadFrequently: true, // GPU optimization
  alpha: false,            // Performance hint
});

// Efficient pixel data handling
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const uint8Array = new Uint8ClampedArray(imageData.data.buffer);
// Direct typed array manipulation for speed
```

**Rendering Pipeline:**
```javascript
// Frame-synchronized updates
function updateCanvas() {
  requestAnimationFrame(() => {
    ctx.putImageData(processedImageData, 0, 0);
    // Update UI elements
    updateToolState(newValues);
    updateDOMElements();
  });
}
```

### State Synchronization

**Image Processing States:**
```javascript
// Store original baseline
let originalImageData = null;

function getOrStoreOriginal() {
  if (!originalImageData) {
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  return originalImageData;
}

// Non-destructive processing
function processImageNonDestructive(processor) {
  const original = getOrStoreOriginal();
  const newImageData = processor(original);
  return newImageData;
}
```

## Performance Optimization

### Real-Time Processing Techniques

**60fps Target Architecture:**
```javascript
// Frame rate management
const TARGET_FPS = 60;
const frameInterval = 1000 / TARGET_FPS;
let lastFrameTime = 0;

function frameStep(currentTime) {
  const deltaTime = currentTime - lastFrameTime;

  if (deltaTime >= frameInterval) {
    updateCanvas();
    lastFrameTime = currentTime;
  }

  requestAnimationFrame(frameStep);
}
```

### Memory and Resource Management

**Canvas Context Pooled Resources:**
```javascript
// Context reuse pattern
const canvasManager = {
  contexts: new Map(),

  getOptimizedContext(id) {
    if (this.contexts.has(id)) {
      return this.contexts.get(id);
    }

    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    this.contexts.set(id, ctx);
    return ctx;
  }
};
```

### Compilation and Caching Systems

**Tool Compilation Pipeline:**
```javascript
// Cache compiled tools
const compiledTools = new Map();

function getCompiledTool(toolSpec) {
  const cacheKey = hashCode(JSON.stringify(toolSpec));

  if (compiledTools.has(cacheKey)) {
    return compiledTools.get(cacheKey);
  }

  const compiled = compileTool(toolSpec);
  compiledTools.set(cacheKey, compiled);
  return compiled;
}
```

**Memory Efficient Caching:**
- **LRU Eviction**: Remove least-recently-used tools
- **Progressive Loading**: Load tool components as needed
- **Cleanup Management**: Proper resource disposal on unmount

### Network and Loading Optimization

**Predictive Loading:**
```javascript
// Preload likely tools based on usage patterns
const predictiveCache = {
  async preloadCommonTools() {
    const popularTools = ['brightness', 'contrast', 'saturation'];
    return Promise.all(
      popularTools.map(tool => fetchToolSpec(tool))
    );
  },

  getPreloadedTool(type) {
    return this.cache.get(type) || generateOnDemand(type);
  }
};
```

**Streaming Generation:**
```javascript
// Progressive tool generation
async function streamToolGeneration(request) {
  const response = await fetch('/api/generate-tool', {
    body: JSON.stringify(request),
    responseType: 'stream' // Streaming response
  });

  for await (const chunk of response.body) {
    const partialTool = parseChunk(chunk);
    renderPartialTool(partialTool);
  }
}
```

This dynamic UI generation system represents a fundamental shift in how users interact with software, enabling anyone to become an "application developer" through natural language conversations while maintaining the performance and reliability of traditional compiled applications.