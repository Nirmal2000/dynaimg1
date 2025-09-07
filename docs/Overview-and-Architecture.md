# DynaImg Architecture Overview

## Table of Contents
- [Project Vision and Purpose](#project-vision-and-purpose)
- [Technical Architecture](#technical-architecture)
- [Core Design Principles](#core-design-principles)
- [Data Flow Architecture](#data-flow-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Security and Performance Considerations](#security-and-performance-considerations)

## Project Vision and Purpose

### What is DynaImg?

**DynaImg** is an innovative AI-powered interactive image editing platform that revolutionizes how users interact with digital image manipulation. Unlike traditional image editors with fixed toolsets, DynaImg generates custom tools on-demand through natural language conversations with AI.

### Core Innovation: Conversational Tool Generation

The fundamental breakthrough of DynaImg lies in its ability to:
- **Transform natural language requests into functional UI components** through Large Language Models
- **Integrate dynamically generated tools seamlessly** into a unified design system
- **Maintain high-performance image processing** through direct HTML5 Canvas manipulation
- **Preserve design consistency** across all AI-generated interface elements

### Target Users and Use Cases

**DynaImg** serves:
- **Professional photographers** seeking specialized editing tools
- **Graphic designers** requiring custom workflow automation
- **Digital artists** needing unique creative controls
- **Developers and researchers** exploring novel interaction paradigms
- **Casual users** using natural language to discover new editing capabilities

## Technical Architecture

### Core Technology Stack

**Frontend Architecture:**
```
Next.js 15.4.5 (App Router)
├── React 19.1.0 + React DOM 19.1.0
├── TypeScript-like JavaScript (Next.js)
├── Tailwind CSS 3.4.17 (Styling)
├── HTML5 Canvas API (Image Processing)
└── Custom CSS Classes (dynaimg-* System)
```

**AI and Machine Learning:**
```
Cerebras LLM (Tool Generation)
├── Model: qwen-3-coder-480b
├── Use Case: Code generation and UI synthesis
└── Integration: LangChain framework

Fal AI (Image Manipulation)
├── Model: fal-ai/flux-pro/kontext
├── Use Case: Generative image editing
└── Integration: RESTful API with queue management
```

**Development and Build Tools:**
```
├── Turbopack (Next.js) - Fast compilation
├── ESLint 9.0 - Code quality
├── PostCSS with Autoprefixer - CSS processing
├── Lucide Icons - Unified icon system
└── Web Fonts (Geist Sans/Mono, Manrope)
```

### Application Architecture Layers

```
┌─────────────────┐
│  User Interface │ ← React Components + Tailwind CSS
├─────────────────┤
│ State Management│ ← Context API (ImageContext, ToolContext)
├─────────────────┤
│   AI Services   │ ← Cerebras (Tool Gen) + Fal AI (Image Edit)
├─────────────────┤
│   Core Engine   │ ← HTML5 Canvas + Web APIs
├─────────────────┤
│ Infrastructure  │ ← Next.js + Node.js Runtime
└─────────────────┘
```

## Core Design Principles

### 1. **Seamless Integration Philosophy**

**The Core Tenet:** "Generated tools must feel native, not imposed."

**Implementation:**
- **Zero-footprint integration** - Tools blend invisibly with existing UI
- **Unified design language** - All generated components follow identical patterns
- **Performance parity** - Dynamic tools perform identically to static components
- **Consistency enforcement** - System prompt ensures 100% design compliance

### 2. **Performance-First Architecture**

**Canvas Direct Access Pattern:**
```javascript
// Traditional approach - Multiple abstraction layers
 jQuery → React → Component → Context → Canvas

// DynaImg approach - Direct hardware acceleration
document.querySelector('canvas') → CanvasRenderingContext2D
```

**Benefits:**
- **Zero abstraction overhead** - Direct GPU acceleration for image processing
- **Pixel-perfect precision** - No loss of image data fidelity
- **Real-time manipulation** - 60fps performance for smooth interactions
- **Memory efficiency** - Minimal JavaScript object creation

### 3. **AI-Generated UI as First-Class Citizens**

**Paradigm Shift:**
Traditional software development requires developers to manually craft each UI component. DynaImg empowers users to "write their own codebase" through conversational interfaces.

**Technical Implementation:**
- **Prompt Engineering:** 440-line system prompt teaches LLMs the complete design system
- **Runtime Integration:** TypeScript-like evaluation of generated JavaScript
- **Style Consistency:** CSS class system enforces visual harmony across all tools
- **Behavioral Standards:** Standardized patterns for user interactions and state management

### 4. **Dual Transformation Patterns**

**Non-Destructive Adjustments:**
```javascript
// Brightness, Contrast, Saturation, Tint
processBrightness(adjustment) {
  // Always work from original image data
  // Preserve quality through fresh pixel calculations
  // Maintain user's ability to reverse modifications
}
```

**Destructive Transformations:**
```javascript
// Flip, Rotate, Resize, Crop
flipHorizontally() {
  // Permanently modify image data
  // Update baseline for subsequent operations
  // Maintain quality through optimized algorithms
}
```

## Data Flow Architecture

### Image Processing Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │    │  Load to    │    │  Display as │
│   Image     │ ── │   Canvas    │ ── │  Base64     │
└─────────────┘    └─────────────┘    └─────────────┘
                                    │
                                    ∨
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │  Send to    │    │   AI       │
│  Requests   │ ── │  Fal API    │ ── │ Processes  │
│ Tool/Filter │    │  Queue      │    │  Image     │
└─────────────┘    └─────────────┘    └─────────────┘
                                    │
                                    ∨
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Queue     │    │  Download   │    │  Replace   │
│  Polling    │ ── │   Result    │ ── │  Canvas    │
│  Status     │    └─────────────┘    │  Image     │
└─────────────┘                       └─────────────┘
```

### Tool Generation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │   Send to   │    │  Cerebras  │
│ Types Tool  │ ── │   API        │ ── │  LLM Gen  │
│ Description │    │   Endpoint   │    │   HTML    │
└─────────────┘    └─────────────┘    └─────────────┘
                                    │
                                    ∨
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Extract   │    │   Parse     │    │   Inject   │
│ JavaScript  │ ── │   HTML      │ ── │  into DOM  │
│   & CSS     │    └─────────────┘    │  Sandbox   │
└─────────────┘                       └─────────────┘
```

### State Synchronization Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Tool      │    │   Update    │    │   Canvas   │
│ Interacts  │ ── │   Canvas    │ ── │  Context   │
│ with Image │    │   Pixels    │    │  State     │
└─────────────┘    └─────────────┘    └─────────────┘
                                    │
                                    ∨
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Notify    │    │   Re-render │    │   Display  │
│ Components │ ── │   Affected  │ ── │   Updated  │
│   of       │    │   Elements  │    │   Image    │
│   Change   │    └─────────────┘    └─────────────┘
```

## Component Hierarchy

### Root Level Architecture

**App Structure (src/app/)**
```
page.js (Root Component)
├── ImageProvider (Context Provider)
├── ToolProvider (Context Provider)
└── HomeContent (Main Content Wrapper)
    ├── HTML Form (Hidden File Upload)
    ├── ImagePanel + TextAreaPanel (Left Column)
    ├── ToolCanvas (Right Column)
    └── SimpleChatInput (Bottom Chat Interface)
```

### Context Architecture

**ImageContext** - Canvas and Image Management
- **canvasRef** - Direct DOM element reference
- **canvasEditor** - Stable rendering interface
- **selectedImage** - Current image state
- **isProcessing** - UI state management
- **loadImageToCanvas()** - Image loading pipeline
- **updateCanvasImage()** - Dynamic image replacement

**ToolContext** - Dynamic Component Management
- **renderedTools[]** - Array of active tool components
- **addTool()** - Tool creation and registration
- **removeTool()** - Tool lifecycle management
- **processToolHtml()** - HTML/CSS/JS parsing and integration
- **executedScripts** - Script execution tracking and deduplication

### Component Architecture Patterns

**Panel Components** - User Interaction Zones
**ImagePanel** - Image upload and canvas management
- File validation (JPEG, PNG, WEBP)
- Canvas initialization and sizing
- Upload state management
- Change image functionality

**TextAreaPanel** - AI Image Editing
- Text input with auto-resizing
- Fal AI integration
- Download functionality
- Status feedback system

**ToolCanvas** - Dynamic Tool Container
- Empty state handling
- Scroll management
- Tool rendering pipeline
- Performance optimization

**SimpleChatInput** - Tool Generation Interface
- Message history management
- Auto tool rendering
- Loading state coordination
- Enter key handling

## Security and Performance Considerations

### Security Architecture

**Sandbox Execution Model:**
- **Scoped JavaScript Execution** - IIFE separated environments
- **DOM Isolation** - Generated tools cannot affect parent components
- **Context Sanitization** - User inputs cleaned before processing
- **API Key Protection** - Server-side credential management

**Input Validation:**
- **File Type Verification** - Restricted image formats
- **Size Limitations** - Reasonable file size constraints
- **Text Sanitization** - XSS prevention in user inputs

### Performance Optimizations

**Canvas Performance Techniques:**
- **willReadFrequently = true** - Optimized context creation
- **getImageData/putImageData** - Direct memory manipulation
- **Typed Arrays** - Efficient pixel data handling
- **Minimal Re-renders** - Targeted component updates

**Memory Management:**
- **Image Data Caching** - Reuse of original image data
- **Context Object Reuse** - Stable editor references
- **Garbage Collection Awareness** - Large ImageData cleanup

**Network Performance:**
- **Queue-Based Processing** - Asynchronous AI interactions
- **Polling Optimization** - Efficient status checking
- **Result Caching** - Avoid duplicate processing
- **Progressive Loading** - Image display before processing completion

### Scalability Considerations

**Growing Tool Ecosystem:**
- **Modular Architecture** - Easy addition of new tool types
- **Context Pattern** - Shared state across unlimited tools
- **Prompt Engineering** - Scalable design system teaching

**Image Processing Scale:**
- **Resolution Independence** - Works with various image sizes
- **Processing Flexibility** - Adapts to different computing capabilities
- **Quality Preservation** - Maintains image integrity across operations

This architecture establishes DynaImg as a pioneering platform that bridges human creativity with computational capability, creating an unprecedented paradigm in software interaction design.