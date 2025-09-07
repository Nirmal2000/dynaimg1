# DynaImg State Management Architecture

## Table of Contents
- [Context Architecture Overview](#context-architecture-overview)
- [ImageContext Deep Dive](#imagecontext-deep-dive)
- [ToolContext Deep Dive](#toolcontext-deep-dive)
- [State Synchronization Patterns](#state-synchronization-patterns)
- [Performance and Memory Management](#performance-and-memory-management)
- [Context Provider Composition](#context-provider-composition)

## Context Architecture Overview

### Dual-Context Philosophy

**DynaImg** employs a sophisticated dual-context architecture that separates concerns while enabling seamless cross-component communication:

**ImageContext** - **Canvas and Image Processing Domain**
- Manages canvas state and pixel operations
- Handles image loading, rendering, and manipulation
- Provides stable API for tool interactions
- Optimizes for high-performance canvas operations

**ToolContext** - **Dynamic Component Domain**
- Manages AI-generated tool lifecycle
- Processes HTML/CSS/JS code fragments
- Handles script execution and isolation
- Maintains tool registry and coordination

### Provider Composition Strategy

```javascript
// Hierarchical provider composition
function App() {
  return (
    <ImageProvider>
      <ToolProvider>
        <MainApplication />
      </ToolProvider>
    </ImageProvider>
  );
}

// Isolated context consumption
function ImagePanel() {
  const imageContext = useImageContext();
  // Access only image-related state
}

function ToolCanvas() {
  const toolContext = useToolContext();
  // Access only tool-related state
}
```

## ImageContext Deep Dive

### Core State Structure

**Primary State Management:**
```javascript
const ImageContext = createContext();

export function ImageProvider({ children }) {
  // Core image state
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Canvas references (React refs for stable references)
  const canvasRef = useRef(null);
  const currentImageRef = useRef(null);
  const originalImageDataRef = useRef(null);

  // Stable canvas API across re-renders
  const canvasEditor = useRef({
    canvas: null,
    ctx: null,
    getImageData: () => { /* implementation */ },
    putImageData: (imageData) => { /* implementation */ },
    toDataURL: () => { /* implementation */ },
    reset: () => { /* implementation */ }
  }).current;

  return (
    <ImageContext.Provider value={/* context value */}>
      {children}
    </ImageContext.Provider>
  );
}
```

### Canvas Editor Architecture

**Stable API Design:**
```javascript
const canvasEditor = {
  // Direct DOM element references
  canvas: null,
  ctx: null,

  // Image data extraction
  getImageData: () => {
    if (!canvasRef.current) return null;
    const ctx = canvasRef.current.getContext('2d', {
      willReadFrequently: true // Performance optimization
    });
    return ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
  },

  // Image data application
  putImageData: (imageData) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d', {
      willReadFrequently: true
    });
    ctx.putImageData(imageData, 0, 0);
  },

  // Data URL export
  toDataURL: () => {
    if (!canvasRef.current) return 'data:,';
    return canvasRef.current.toDataURL();
  },

  // Reset to original state
  reset: () => {
    if (!canvasRef.current || !originalImageDataRef.current) return;
    const ctx = canvasRef.current.getContext('2d', {
      willReadFrequently: true
    });
    ctx.putImageData(originalImageDataRef.current, 0, 0);
  }
};
```

### Image Processing Pipeline

**Load to Canvas Process:**
```javascript
const loadImageToCanvas = useCallback((imageSrc) => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = new Image();

  img.onload = () => {
    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Render image to canvas
    ctx.drawImage(img, 0, 0);

    // Store image reference
    currentImageRef.current = img;

    // Store original pixel data
    originalImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Update stable references
    canvasEditor.canvas = canvas;
    canvasEditor.ctx = ctx;

    // Set context for future operations
    canvasEditor.ctx = ctx;
  };

  img.src = imageSrc;
}, [canvasEditor]);
```

**Canvas Update Process:**
```javascript
const updateCanvasImage = useCallback((newImageDataUrl) => {
  if (!canvasRef.current) return;

  const img = new Image();
  img.onload = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Update canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Render new image
    ctx.drawImage(img, 0, 0);

    // Update references for future operations
    currentImageRef.current = img;
    canvasEditor.canvas = canvas;
    canvasEditor.ctx = ctx;
  };
  img.src = newImageDataUrl;
}, [canvasEditor]);
```

**Context Provider Value:**
```javascript
const value = {
  // State getters/setters
  selectedImage,
  setSelectedImage,
  isProcessing,
  setIsProcessing,

  // Canvas interaction
  canvasRef: canvasRef.current,
  setCanvasRef,
  loadImageToCanvas,
  updateCanvasImage,

  // Stable canvas editor API
  canvasEditor,

  // Helper functions
  getCurrentImageDataUrl: () => canvasEditor.toDataURL(),
  resetToOriginal: () => canvasEditor.reset()
};
```

## ToolContext Deep Dive

### Core State Structure

**Tool Lifecycle Management:**
```javascript
const ToolContext = createContext();

export function ToolProvider({ children }) {
  // Tool state
  const [renderedTools, setRenderedTools] = useState([]);

  // Script management (ref-based for performance)
  const executedScriptsRef = useRef(new Set());
  const toolScriptsRef = useRef(new Map());

  // Error state
  const [toolErrors, setToolErrors] = useState(new Map());

  return (
    <ToolContext.Provider value={/* context value */}>
      {children}
    </ToolContext.Provider>
  );
}
```

### Tool Processing Architecture

**HTML/CSS/JS Processing Pipeline:**
```javascript
const addTool = useCallback((code, id = `tool-${Date.now()}`) => {
  // Process HTML to native format
  const processedHtml = processToolHtml(code, id);

  // Create tool object
  const newTool = {
    id,
    processedHtml,
    timestamp: Date.now(),
    error: null
  };

  // Add to rendered tools (prepend for latest first)
  setRenderedTools(prev => [newTool, ...prev]);

  return id;
}, []);
```

**Multi-Stage HTML Processing:**
```javascript
const processToolHtml = useCallback((code, toolId) => {
  // Stage 1: Extract JavaScript
  const scriptMatches = code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  let jsCode = '';

  if (scriptMatches) {
    jsCode = scriptMatches.map(script => {
      const match = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      return match ? match[1] : '';
    }).join('\n');
  }

  // Stage 2: Remove scripts from HTML
  const htmlWithoutScripts = code.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Stage 3: Process based on document type
  if (htmlWithoutScripts.includes('<html') || htmlWithoutScripts.includes('<!DOCTYPE')) {
    // Full HTML document processing
    return processCompleteHtmlDocument(htmlWithoutScripts, jsCode, toolId);
  } else {
    // HTML fragment processing
    return processHtmlFragment(htmlWithoutScripts, jsCode, toolId);
  }
}, []);
```

**Complete HTML Document Processing:**
```javascript
function processCompleteHtmlDocument(fullHtml, jsCode, toolId) {
  // Parse complete HTML document
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, 'text/html');

  // Extract styles from <head>
  const styles = Array.from(doc.querySelectorAll('style'))
    .map(style => style.innerHTML)
    .join('\n');

  // Extract body content
  const bodyContent = doc.body.innerHTML;

  // Store and execute scripts
  if (jsCode) {
    toolScriptsRef.current.set(toolId, jsCode);
    if (!executedScriptsRef.current.has(toolId)) {
      executedScriptsRef.current.add(toolId);
      executeToolScript(jsCode, toolId);
    } else {
      // Re-execute for updated tools
      executeToolScript(jsCode, toolId);
    }
  }

  // Generate integrated HTML fragment
  return `
    <style>
      ${styles}
      /* Integration styles */
      * { box-sizing: border-box; }
    </style>
    ${bodyContent}
  `;
}
```

**Script Execution System:**
```javascript
function executeToolScript(jsCode, toolId) {
  setTimeout(() => {
    try {
      // Sandbox with IIFE
      const wrappedCode = `(function() {
        ${jsCode}
      })();`;

      // Execute with error handling
      eval(wrappedCode);

      // Mark tool as successfully executed
      markToolAsActive(toolId);

    } catch (error) {
      console.error(`Error executing tool script for ${toolId}:`, error);

      // Update error state
      setToolErrors(prev => new Map(prev).set(toolId, error.message));

      // Mark tool as failed
      markToolAsFailed(toolId);
    }
  }, 100); // Delay for DOM readiness
}
```

### Tool Lifecycle Management

**Removal and Cleanup:**
```javascript
const removeTool = useCallback((toolId) => {
  setRenderedTools(prev => prev.filter(tool => tool.id !== toolId));

  // Clean up executed scripts
  executedScriptsRef.current.delete(toolId);
  toolScriptsRef.current.delete(toolId);

  // Clean up error state
  setToolErrors(prev => {
    const newErrors = new Map(prev);
    newErrors.delete(toolId);
    return newErrors;
  });
}, []);
```

**Clear All Tools:**
```javascript
const clearTools = useCallback(() => {
  // Reset tool state
  setRenderedTools([]);

  // Reset script tracking
  executedScriptsRef.current = new Set();
  toolScriptsRef.current = new Map();

  // Clear error state
  setToolErrors(new Map());
}, []);
```

### Context Provider Value

**Complete Tool Function Set:**
```javascript
const value = {
  // Tool state
  renderedTools,
  toolErrors,

  // Tool management
  addTool,
  removeTool,
  clearTools,

  // Utility functions
  isToolActive: (toolId) => renderedTools.some(tool => tool.id === toolId),
  getToolError: (toolId) => toolErrors.get(toolId),

  // Script tracking
  getExecutedScripts: () => Array.from(executedScriptsRef.current),
  getToolScripts: () => Array.from(toolScriptsRef.current.entries())
};
```

## State Synchronization Patterns

### Cross-Context Communication

**AI Processing Workflow:**
```javascript
// State flow: User Input → AI → Image Update → Tool Access
async function processAiEdit(prompt) {
  // 1. Set processing state in ImageContext
  setIsProcessing(true);

  try {
    // 2. Send to Fal AI API
    const result = await callFalAPI(prompt);

    // 3. Update canvas in ImageContext
    updateCanvasImage(result.imageDataUrl);

    // 4. Success notification
    setProcessingState('success');

  } catch (error) {
    // 5. Error handling
    setProcessingState('error', error.message);
  } finally {
    // 6. Reset processing state
    setIsProcessing(false);
  }
}
```

### Component-to-Canvas Synchronization

**Callback Registration Pattern:**
```javascript
// Component registers interest in canvas operations
function ToolInteractionComponent({ onCanvasReady }) {
  const { canvasEditor } = useImageContext();

  useEffect(() => {
    // Notify parent when canvas is available
    if (canvasEditor?.canvas && onCanvasReady) {
      onCanvasReady(canvasEditor);
    }
  }, [canvasEditor, onCanvasReady]);

  return (
    <button onClick={() => {
      // Direct canvas manipulation
      if (canvasEditor?.ctx) {
        // Apply tool effect
        applyToolEffect(canvasEditor);
      }
    }}>
      Apply Tool
    </button>
  );
}
```

### State Persistence Patterns

**Session State Management:**
```javascript
// Preserve state across component re-mounts
const usePersistedCanvasState = () => {
  const { selectedImage, canvasEditor } = useImageContext();

  // Cache canvas data in session storage
  const saveCanvasState = () => {
    if (canvasEditor?.canvas) {
      const imageData = canvasEditor.toDataURL();
      sessionStorage.setItem('canvasState', imageData);
    }
  };

  const restoreCanvasState = () => {
    const savedState = sessionStorage.getItem('canvasState');
    if (savedState) {
      canvasEditor.updateCanvasImage(savedState);
    }
  };

  return { saveCanvasState, restoreCanvasState };
};
```

## Performance and Memory Management

### Reference Stability Optimization

**Stable Object Pattern:**
```javascript
// Avoid context re-creation on every render
const stableCanvasEditor = useRef({
  // All methods defined once
  getImageData: () => { /* implementation */ },
  putImageData: () => { /* implementation */ },
  toDataURL: () => { /* implementation */ },
  reset: () => { /* implementation */ }
}).current;

// Reusable across component lifecycle
const canvasHelpers = {
  resize: (width, height) => { /* implementation */ },
  clear: () => { /* implementation */ },
  copyRegion: () => { /* implementation */ }
};
```

### Memory Leak Prevention

**Cleanup on Unmount:**
```javascript
useEffect(() => {
  // Component initialization
  const canvas = canvasRef.current;

  return () => {
    // Cleanup on unmount
    if (canvas) {
      // Clear canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Clear references
      canvasRef.current = null;
      currentImageRef.current = null;
      originalImageDataRef.current = null;
    }

    // Clear executed scripts
    executedScriptsRef.current.clear();
    toolScriptsRef.current.clear();
  };
}, []);
```

### State Batching and Optimization

**Batch State Updates:**
```javascript
// Batch related state changes
const updateImageAndTools = useCallback(() => {
  // Single re-render batch
  ReactDOM.unstable_batchedUpdates(() => {
    setIsProcessing(true);
    addTool(newToolSpec);
    updateCanvasWithNewImage(imageData);
    setIsProcessing(false);
  });
}, [newToolSpec, imageData]);
```

## Context Provider Composition

### Provider Hierarchy Strategy

**Composition Pattern:**
```javascript
// Multiple context providers with proper hierarchy
function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <ImageProvider>
        <ToolProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ToolProvider>
      </ImageProvider>
    </ErrorBoundary>
  );
}

// Usage
function App() {
  return (
    <AppProviders>
      <MainApplication />
    </AppProviders>
  );
}
```

### Testing Context Isolation

**Context Testing Pattern:**
```javascript
// Test components with isolated contexts
const customRender = (component, options = {}) => {
  const { imageContextValue, toolContextValue, ...renderOptions } = options;

  const mergedImageValue = {
    ...defaultImageContextValue,
    ...imageContextValue
  };

  const mergedToolValue = {
    ...defaultToolContextValue,
    ...toolContextValue
  };

  return render(
    <ImageProvider value={mergedImageValue}>
      <ToolProvider value={mergedToolValue}>
        {component}
      </ToolProvider>
    </ImageProvider>,
    renderOptions
  );
};
```

This sophisticated state management architecture enables the complex, dynamic interactions between AI-generated tools and canvas-based image processing while maintaining performance, memory efficiency, and code organization.