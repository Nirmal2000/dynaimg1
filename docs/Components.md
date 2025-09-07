# DynaImg Components Architecture

## Table of Contents
- [Core Component Hierarchy](#core-component-hierarchy)
- [Root Application Structure](#root-application-structure)
- [Context Providers](#context-providers)
- [UI Component Analysis](#ui-component-analysis)
- [Layout and Responsive Design](#layout-and-responsive-design)
- [Component Lifecycle Management](#component-lifecycle-management)

## Core Component Hierarchy

### Application Entry Point Structure

```
📁 src/app/
├── page.js (Root Container Component)
│   ├── ImageProvider (Context Provider)
│   ├── ToolProvider (Context Provider)
│   └── HomeContent (Main Application Layout)
│       ├── HTML File Input (Hidden)
│       ├── ImagePanel + TextAreaPanel (Left Column)
│       ├── ToolCanvas (Right Column)
│       └── SimpleChatInput (Bottom Chat Interface)
```

### Component Responsibility Matrix

| Component | Responsibility | Context | Dependencies |
|-----------|---------------|---------|--------------|
| `page.js` | Root application setup | None | All contexts + components |
| `HomeContent` | Main layout orchestration | ImageProvider + ToolProvider | All UI components |
| `ImagePanel` | Canvas display and upload | ImageProvider | Canvas API |
| `TextAreaPanel` | AI editing interface | ImageProvider | Fal AI API |
| `ToolCanvas` | Dynamic tool renderer | ToolProvider | DOM manipulation |
| `SimpleChatInput` | Tool generation interface | ToolProvider | Cerebras API |

## Root Application Structure

### Page Component Architecture

```javascript
// src/app/page.js - Application Root
function HomeContent() {
  // State coordination
  const { setSelectedImage, isProcessing } = useImageContext();

  // File upload handling
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Tool generation callbacks
  const [editImageFunction, setEditImageFunction] = useState(null);
  const [downloadFunction, setDownloadFunction] = useState(null);

  // File input processing
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // File validation
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP)');
      return;
    }

    setError(null);

    // File to data URL conversion
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload trigger
  const handleUploadClick = () => fileInputRef.current?.click();

  // Callback registration
  const onEditImageCallback = useCallback((func) => {
    setEditImageFunction(() => func);
  }, []);

  const onDownloadCallback = useCallback((func) => {
    setDownloadFunction(() => func);
  }, []);

  return (
    // Dual context providers
    <ToolProvider>
      <div className="h-screen bg-[#3b3b3b] p-[2.5vw] flex gap-[1.25vw]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />

        // Application layout (detailed below)
        {/* Left Column - 60% Width */}
        <LeftPanel
          onUploadClick={handleUploadClick}
          onEditImage={onEditImageCallback}
          onDownload={onDownloadCallback}
          error={error}
        />

        {/* Right Column - 32% Width */}
        <RightPanel />
      </div>
    </ToolProvider>
  );
}

export default function Home() {
  // Context provider composition
  return (
    <ImageProvider>
      <ToolProvider>
        <HomeContent />
      </ToolProvider>
    </ImageProvider>
  );
}
```

### Responsive Layout System

**Viewport-Proportional Sizing:**
```css
/* CSS VW units for adaptive scaling */
.left-panel { width: 60vw; }
.right-panel { width: 32vw; }
.panel-spacing { gap: 1.25vw; }

/* Height-based scaling */
.image-display { height: 56vh; }
.tool-panel { height: 88.1vh; }
.action-button { height: 7.9vh; }
```

**Responsive Breakpoints:**
- **Desktop (default)**: 60/32 width ratio
- **Adaptive scaling**: All measurements scale with viewport
- **Performance optimization**: CSS transforms for GPU acceleration

### Component Composition Pattern

**Provider Composition Strategy:**
```javascript
// Hierarchical context provider wrapper
function AppProviders({ children }) {
  return (
    <ImageProvider>
      <ToolProvider>
        {children}
      </ToolProvider>
    </ImageProvider>
  );
}

// Component isolation
function FeatureComponent() {
  const imageContext = useImageContext();
  const toolContext = useToolContext();

  // Component logic
  return <div>Feature Implementation</div>;
}
```

## Context Providers

### ImageContext Implementation

**Core Functionality:**
```javascript
// src/contexts/ImageContext.js
const ImageContext = createContext();

export function ImageProvider({ children }) {
  // Image state management
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Canvas management
  const canvasRef = useRef(null);
  const currentImageRef = useRef(null);
  const originalImageDataRef = useRef(null);

  // Stable canvas API
  const canvasEditor = useRef({
    canvas: null,
    ctx: null,

    getImageData: () => {
      if (!canvasRef.current) return null;
      const ctx = canvasRef.current.getContext('2d', {
        willReadFrequently: true
      });
      return ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    },

    putImageData: (imageData) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d', {
        willReadFrequently: true
      });
      ctx.putImageData(imageData, 0, 0);
    },

    toDataURL: () => {
      if (!canvasRef.current) return 'data:,';
      return canvasRef.current.toDataURL();
    },

    reset: () => {
      if (!canvasRef.current || !originalImageDataRef.current) return;
      const ctx = canvasRef.current.getContext('2d', {
        willReadFrequently: true
      });
      ctx.putImageData(originalImageDataRef.current, 0, 0);
    }
  }).current;
```

**Canvas Initialization:**
```javascript
const loadImageToCanvas = useCallback((imageSrc) => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    currentImageRef.current = img;
    originalImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Update stable reference
    canvasEditor.canvas = canvas;
    canvasEditor.ctx = ctx;
  };

  img.src = imageSrc;
}, [canvasEditor]);
```

**Image Processing Pipeline:**
```javascript
const updateCanvasImage = useCallback((newImageDataUrl) => {
  if (!canvasRef.current) return;

  const img = new Image();
  img.onload = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Update references
    currentImageRef.current = img;
    canvasEditor.canvas = canvas;
    canvasEditor.ctx = ctx;
  };
  img.src = newImageDataUrl;
}, [canvasEditor]);
```

### ToolContext Implementation

**Tool Lifecycle Management:**
```javascript
// src/contexts/ToolContext.js
const ToolContext = createContext();

export function ToolProvider({ children }) {
  // Tool state
  const [renderedTools, setRenderedTools] = useState([]);

  // Script execution tracking
  const executedScriptsRef = useRef(new Set());
  const toolScriptsRef = useRef(new Map());

  // Tool creation
  const addTool = useCallback((code, id = `tool-${Date.now()}`) => {
    const processedHtml = processToolHtml(code, id);

    const newTool = {
      id,
      processedHtml,
      timestamp: Date.now()
    };

    setRenderedTools(prev => [newTool, ...prev]);
    return id;
  }, []);

  // Tool removal
  const removeTool = useCallback((toolId) => {
    setRenderedTools(prev => prev.filter(tool => tool.id !== toolId));
  }, []);

  // Tool clearing
  const clearTools = useCallback(() => {
    setRenderedTools([]);
    executedScriptsRef.current = new Set();
    toolScriptsRef.current = new Map();
  }, []);
```

**HTML Processing Engine:**
```javascript
const processToolHtml = useCallback((code, toolId) => {
  // Extract JavaScript
  const scriptMatches = code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  let jsCode = '';

  if (scriptMatches) {
    jsCode = scriptMatches.map(script => {
      const match = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      return match ? match[1] : '';
    }).join('
');
  }

  // Remove script tags from HTML
  const htmlWithoutScripts = code.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Process based on document type
  if (htmlWithoutScripts.includes('<html') || htmlWithoutScripts.includes('<!DOCTYPE')) {
    // Complete HTML document
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlWithoutScripts, 'text/html');

    // Extract components
    const styles = Array.from(doc.querySelectorAll('style'))
      .map(style => style.innerHTML)
      .join('
');

    const bodyContent = doc.body.innerHTML;

    // Store script and execute
    if (jsCode) {
      toolScriptsRef.current.set(toolId, jsCode);
      if (!executedScriptsRef.current.has(toolId)) {
        executedScriptsRef.current.add(toolId);
        setTimeout(() => {
          try {
            const wrappedCode = `(function() { ${jsCode} })();`;
            eval(wrappedCode);
          } catch (error) {
            console.error(`Error executing tool script for ${toolId}:`, error);
          }
        }, 100);
      }
    }

    return `
      <style>
        ${styles}
        * { box-sizing: border-box; }
      </style>
      ${bodyContent}
    `;
  } else {
    // Execute script for fragment
    if (jsCode) {
      toolScriptsRef.current.set(toolId, jsCode);
      if (!executedScriptsRef.current.has(toolId)) {
        executedScriptsRef.current.add(toolId);
        setTimeout(() => {
          try {
            const wrappedCode = `(function() { ${jsCode} })();`;
            eval(wrappedCode);
          } catch (error) {
            console.error(`Error executing tool script for ${toolId}:`, error);
          }
        }, 10);
      }
    }

    return `
      <style>
        * { box-sizing: border-box; }
      </style>
      ${htmlWithoutScripts}
    `;
  }
}, []);
```

## UI Component Analysis

### ImagePanel Component

**Primary Responsibilities:**
- Canvas rendering and image display
- File upload functionality
- Image quality preservation

**Implementation Details:**
```javascript
// src/components/ImagePanel.js
export default function ImagePanel({ onUploadClick, error }) {
  const { selectedImage, setCanvasRef, loadImageToCanvas } = useImageContext();

  // Image loading effect
  useEffect(() => {
    if (selectedImage) {
      loadImageToCanvas(selectedImage);
    }
  }, [selectedImage, loadImageToCanvas]);

  if (selectedImage) {
    // Render canvas with image
    return (
      <div className="relative h-[56vh] bg-[#515050] rounded-[2.875rem] border-[0.625rem] border-[#515050] overflow-hidden w-[60vw]">
        <div className="w-full h-full flex items-center justify-center">
          <canvas
            ref={setCanvasRef}
            className="max-w-full max-h-full rounded-lg"
          />
        </div>

        {/* Change image button */}
        <button
          onClick={onUploadClick}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm hover:bg-opacity-70 transition-all z-10"
        >
          Change
        </button>
      </div>
    );
  }

  // Upload state
  return (
    <div className="relative h-[56vh] bg-[#515050] rounded-[2.875rem] border-[0.625rem] border-[#515050] overflow-hidden w-[60vw] flex flex-col items-center justify-center">
      <div className="text-center">
        {/* Upload icon */}
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Upload button */}
        <button
          onClick={onUploadClick}
          className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors mb-4"
        >
          Upload Image
        </button>

        <p className="text-gray-400 text-sm">Select JPEG, PNG, or WEBP files</p>

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
```

### TextAreaPanel Component

**Primary Responsibilities:**
- AI-powered image editing interface
- Fal AI integration
- Download functionality

**Implementation Details:**
```javascript
// src/components/TextAreaPanel.js
export default function TextAreaPanel({ onEditImage, onDownload }) {
  const { canvasEditor, isProcessing, setIsProcessing, updateCanvasImage } = useImageContext();

  const [textValue, setTextValue] = useState('');
  const [status, setStatus] = useState('');

  // Handle AI image editing
  const handleSendText = useCallback(async () => {
    if (!textValue.trim() || isProcessing) return;

    // Validation
    if (!canvasEditor?.canvas) {
      setStatus('No image available');
      return;
    }

    const currentImageDataUrl = canvasEditor.toDataURL();
    if (!currentImageDataUrl || currentImageDataUrl === 'data:,') {
      setStatus('Please load an image first');
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('');

      // Fal AI API call
      const response = await fetch('/api/fal-edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textValue.trim(),
          imageDataUrl: currentImageDataUrl
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update canvas with result
        console.log('Loading new image into canvas...');
        updateCanvasImage(data.imageDataUrl);

        setStatus('Image edited successfully!');
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus(`Error: ${data.error}`);
        setTimeout(() => setStatus(''), 5000);
      }
    } catch (error) {
      console.error('Error editing image:', error);
      setStatus('Network error - please try again');
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  }, [textValue, canvasEditor, isProcessing, setIsProcessing, updateCanvasImage]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!canvasEditor?.canvas) {
      console.warn('No canvas available for download');
      return;
    }

    try {
      const dataURL = canvasEditor.toDataURL();
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }, [canvasEditor]);

  // Register callback functions
  useEffect(() => {
    if (onEditImage) onEditImage(handleSendText);
    if (onDownload) onDownload(handleDownload);
  }, [handleSendText, handleDownload, onEditImage, onDownload]);

  return (
    // Styled textarea container
    <div className="rounded-[46px] flex items-start justify-between w-[60vw] mt-4"
         style={{ /* Inline styles for complex background */ }}>
      {/* Dynamic textarea with auto-resize */}
      <textarea
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        placeholder="Describe how you'd like to edit the image..."
        className="bg-transparent text-[#aeaeae] font-mono outline-none flex-1 leading-relaxed resize-none text-lg"
        style={{
          wordWrap: "break-word",
          fontFamily: "var(--font-manrope), monospace"
        }}
        rows={1}
        disabled={isProcessing}
        onInput={(e) => {
          // Auto-resize logic
          e.target.style.height = "auto";
          const newHeight = e.target.scrollHeight;
          const lineHeight = 24;
          const maxHeight = lineHeight * 5;
          e.target.style.height = Math.min(newHeight, maxHeight) + "px";
          e.target.style.overflowY = newHeight > maxHeight ? "auto" : "hidden";
        }}
      />

      {/* Processing status display */}
      {status && (
        <div className={`absolute top-2 right-2 text-xs ${
          status.includes('Error') || status.includes('Please')
            ? 'text-red-400'
            : status.includes('successfully')
            ? 'text-green-400'
            : 'text-blue-400'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
```

### ToolCanvas Component

**Primary Responsibilities:**
- Dynamic tool rendering
- Empty state management
- Tool positioning and layout

**Implementation Details:**
```javascript
// src/components/ToolCanvas.js
export default function ToolCanvas() {
  const { renderedTools, removeTool } = useToolContext();

  if (renderedTools.length === 0) {
    // Empty state rendering
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-[#515050]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-[#aeaeae] text-sm" style={{ fontFamily: "var(--font-manrope), sans-serif" }}>
            Generate tools to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    // Main tool rendering container
    <div className="w-full h-full overflow-y-auto scrollbar-hide">
      <div className="space-y-[1.25vw]">
        {renderedTools.map((tool) => (
          <div key={tool.id} className="relative">
            {/* Render tool HTML directly */}
            <div
              dangerouslySetInnerHTML={{ __html: tool.processedHtml }}
              className="w-full overflow-hidden"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### SimpleChatInput Component

**Primary Responsibilities:**
- Tool generation interface
- Message history management
- Auto-render extracted code

**Implementation Details:**
```javascript
// src/components/SimpleChatInput.js
export default function SimpleChatInput() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addTool } = useToolContext();

  // Code block extraction utilities
  const extractCodeBlocks = useCallback((content) => {
    const codeBlockRegex = /```(?:html|javascript|js|css)?\n?([\s\S]*?)```/g;
    const blocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        code: match[1].trim(),
        fullMatch: match[0]
      });
    }

    return blocks;
  }, []);

  // Find largest code block
  const findLargestCodeBlock = useCallback((codeBlocks) => {
    if (codeBlocks.length === 0) return null;

    return codeBlocks.reduce((largest, current) =>
      current.code.length > largest.code.length ? current : largest
    );
  }, []);

  // Auto-render functionality
  const autoRenderLargestBlock = useCallback((content) => {
    const codeBlocks = extractCodeBlocks(content);
    const largestBlock = findLargestCodeBlock(codeBlocks);

    if (largestBlock) {
      const toolId = `auto-${Date.now()}`;
      // Use React context instead of global events
      addTool(largestBlock.code, toolId);
    }
  }, [addTool, extractCodeBlocks, findLargestCodeBlock]);

  // Message sending handler
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Cerebras API call
      const response = await fetch('/api/generate-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.content
      };

      // Update messages (hidden from UI)
      setMessages([...updatedMessages, assistantMessage]);

      // Auto-render extracted code
      autoRenderLargestBlock(data.content);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  return (
    <div className="w-full flex items-center space-x-2">
      {/* Input field */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Generate a tool..."
        className="bg-transparent text-[#aeaeae] outline-none flex-1 text-lg font-mono resize-none"
        disabled={isLoading}
      />

      {/* Send button */}
      <button
        onClick={handleSendMessage}
        disabled={!inputValue.trim() || isLoading}
        className="text-[#aeaeae] hover:text-white transition-colors flex-shrink-0"
        title="Generate tool"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#aeaeae]"></div>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
```

## Layout and Responsive Design

### Responsive Architecture

**Viewport-Based Spacing:**
- All spacing uses `vw` units for proportional scaling
- Components adapt to different screen sizes
- Font sizes and element dimensions scale appropriately

**Flexible Layout System:**
```css
/* Core layout principles */
.layout-container {
  display: flex;
  gap: 1.25vw;
  padding: 2.5vw;
  height: 100vh;
}

.left-panel {
  flex: 1 (60vw);
  display: flex;
  flex-direction: column;
}

.right-panel {
  width: 32vw;
  height: 88.1vh;
}
```

### Visual Hierarchy Architecture

**Z-Index Management:**
- Base components: z-index 1
- Overlay buttons: z-index 10
- Modal dialogs: z-index 50
- Loading screens: z-index 100

**Element Positioning:**
- Canvas positioned absolutely within containers
- Overlay buttons use corner positioning
- Text elements use baseline alignment

## Component Lifecycle Management

### Mounting and Initialization

**Context Provider Setup:**
1. **ImageProvider** initializes canvas management
2. **ToolProvider** prepares tool processing pipeline
3. **Component mounting** triggers canvas setup and event binding

**Canvas Initialization Sequence:**
```javascript
// Image upload → canvas setup → image rendering → tool availability
onFileSelect → setSelectedImage → useEffect → loadImageToCanvas → canvas ready
```

### State Synchronization

**Cross-Component Communication:**
- **ImageContext** broadcasts canvas state changes
- **ToolContext** announces tool additions/removals
- **Component props** pass user interaction callbacks
- **DOM events** coordinate between visual elements

### Cleanup and Memory Management

**Resource Disposal:**
```javascript
// On component unmount
useEffect(() => {
  return () => {
    // Clean up canvas references
    canvasRef.current = null;

    // Remove event listeners
    window.removeEventListener('resize', handleResize);

    // Clear tool execution tracking
    executedScriptsRef.current.clear();
    toolScriptsRef.current.clear();
  };
}, []);
```

**Performance Optimization:**
- **Reference cleanup**: Prevent memory leaks
- **Event listener removal**: Avoid memory accumulation
- **Canvas context disposal**: Free GPU resources
- **Tool cache clearing**: Release compiled tool code

This comprehensive component architecture creates a robust, scalable system that handles the complex interactions between AI-generated tools, image processing, and user interface management while maintaining high performance and visual consistency.