# DynaImg Design System Documentation

## Table of Contents
- [System Philosophy](#system-philosophy)
- [Color Palette and Themes](#color-palette-and-themes)
- [Typography System](#typography-system)
- [Spacing and Layout](#spacing-and-layout)
- [Component Patterns](#component-patterns)
- [Interactive Elements](#interactive-elements)
- [Animation and Motion](#animation-and-motion)
- [Icon System Integration](#icon-system-integration)

## System Philosophy

### "Seamless Integration Through Consistency"

DynaImg's design system is built on three core principles:
1. **Seamless Blending** - AI-generated tools must look and feel native
2. **Performance First** - Design choices optimize for canvas rendering speed
3. **Scalable Consistency** - System accommodates infinite tool variations

### Design Language Evolution

Unlike traditional design systems that dictate rigid rules, DynaImg's system adapts to accommodate unlimited AI-generated variations while maintaining visual harmony.

## Color Palette and Themes

### CSS Variables System

**Core Theme Variables** (defined in `globals.css`)

```css
:root {
  /* Base Colors */
  --background: #3b3b3b;      /* Main app background */
  --foreground: #aeaeae;      /* Primary text color */
  --text-hover: white;        /* Interactive state color */

  /* Interface Borders */
  --border-default: #515050;  /* Standard borders */
  --border-active: #A3A3A3;   /* Focus/active states */

  /* Interactive Elements */
  --slider-track: rgba(37, 37, 37, 0.3);
  --slider-thumb: #D9D9D9;
}
```

### Visual Hierarchy Colors

**Primary Color Roles:**
- **Background (#3b3b3b)**: Primary canvas and main container color
- **Surface (#454545-#515050)**: Panel backgrounds with depth calculation
- **Text (#aeaeae)**: Primary reading color for all interface elements
- **Interactive (#A3A3A3)**: Active and hover states
- **Overlay (rgba(28, 28, 28, 0.31))**: Translucent elements for depth

### Contextual Color Usage

**Interface States:**
- **Default**: `--foreground` for readable text
- **Hover**: `--text-hover` for interactive feedback
- **Active**: `--border-active` for selected elements
- **Processing**: Animated opacity states (60fps)

**Visual Feedback:**
- **Success**: `#10B981` (green) for completions
- **Error**: `#EF4444` (red) for failures
- **Processing**: `#3B82F6` (blue) for ongoing operations
- **Warning**: `#F59E0B` (yellow) for alerts

## Typography System

### Font Stack Architecture

**Primary Fonts:**
```css
font-family: Manrope, sans-serif;
/* Retrieved from /* Next.js Font Optimization */
- Weight Options: 400 (Regular), 500 (Medium), 600 (SemiBold)
- Character Set: Latin extended
- Display: swap (Web font optimization)
```

**Fallback Fonts:**
```css
/* Monospace Context */
font-family: "Geist Mono", var(--font-geist-mono), monospace;

/* Headline Context */
font-family: "Geist Sans", var(--font-geist-sans), sans-serif;
```

### Type Scale and Usage

**Font Size Scale:**
- **Interface Labels**: `text-lg` / `18px` - Control labels, values
- **Body Text**: `text-base` / `16px` - Descriptions, help text
- **Small Text**: `text-sm` / `14px` - Captions, metadata

**Font Weight Hierarchy:**
- **Medium (500)**: Primary labels and interface controls
- **Regular (400)**: Body text and supplementary information
- **SemiBold (600)**: Emphasis and call-to-action elements

**Line Height Standards:**
- **Body Text**: `leading-relaxed` - Comfortable reading line spacing
- **Interface Elements**: `leading-tight` - Compact for screen real estate
- **Auto-resizing**: Dynamic line height calculation in text areas

## Spacing and Layout

### VW-Based Responsive Spacing System

**Base Spacing Unit**: `vw` (viewport width) for proportional scaling

**Vertical Spacing (Margins):**
```css
/* Section Separation */
.dynaimg-section-spacing { margin-bottom: 1.25vw; }

/* Label to Control */
.dynaimg-label-spacing { margin-bottom: 0.625vw; }

/* Control Groups */
.dynaimg-control-spacing > * + * { margin-top: 1.25vw; }
```

**Horizontal Spacing:**
```css
/* Icon Groups */
.dynaimg-icon-spacing { gap: 1.2vw; }

/* Interactive Elements */
.interaction-spacing { gap: 1.25vw; }
```

### Layout Patterns

**Two-Column Responsive Design:**
```css
/* Left Column - 60vw */
.image-column {
  flex: 1;
  width: 60vw;
}

/* Right Column - 32vw */
.tool-column {
  height: 88.1vh;
  width: 32vw;
}

/* Gap */
.columns-gap { gap: 1.25vw; }
```

**Component Container Patterns:**
```css
/* Rounded Panels */
.panel-radius { border-radius: 46px; }
.panel-large-radius { border-radius: 71px; }

/* Container Widths */
.panel-width-sm { width: 16.6vw; }
.panel-width-md { width: 32vw; }
.panel-width-lg { width: 60vw; }
```

## Component Patterns

### Slider Component System

**CSS Implementation:**
```css
/* Slider Container */
.dynaimg-slider-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.625vw;
}

/* Slider Wrapper */
.dynaimg-slider-wrapper {
  position: relative;
}

/* Slider Track Styling */
.dynaimg-slider {
  width: 100%;
  height: 4px;
  border-radius: 9999px;
  appearance: none;
  background: transparent;
  border: 9px solid var(--slider-track);
  box-shadow: inset 0px 3px 6px rgba(0, 0, 0, 0.17);
  cursor: pointer;
}

/* Cross-browser Thumb Styling */
.dynaimg-slider::-webkit-slider-thumb,
.dynaimg-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--slider-thumb);
  box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  border: none;
  appearance: none;
  -moz-appearance: none;
}
```

**Usage Example:**
```html
<div class="dynaimg-section-spacing">
  <div class="dynaimg-slider-container">
    <span class="dynaimg-text">Brightness</span>
    <span class="dynaimg-text" id="brightness-value">50%</span>
  </div>
  <div class="dynaimg-slider-wrapper">
    <input
      type="range"
      min="0"
      max="100"
      value="50"
      id="brightness-slider"
      class="dynaimg-slider"
    />
  </div>
</div>
```

### Button System

**Filter/Toggle Button Pattern:**
```css
.dynaimg-filter-button {
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  width: 75px;
  height: 75px;
  cursor: pointer;
  box-sizing: border-box;
  border: none;
  box-shadow: none;
}

.dynaimg-filter-button.active {
  border: none;
}
```

**Action Button Pattern:**
```css
.action-button {
  width: 16.6vw;
  height: 7.9vh;
  border: 8px solid var(--border-default);
  border-radius: 39px;
  background: rgba(61, 61, 61, 0.01);
  box-shadow: 0px -3px 10px 3px rgba(0, 0, 0, 0.07),
              inset 0px -7px 10px 3px rgba(0, 0, 0, 0.15);
  transition: background-color 0.2s;
}

.action-button:hover {
  background: rgba(66, 66, 66, 0.5);
}
```

### Text Area Patterns

**Expandable Text Input:**
```css
.dynamic-textarea {
  background: rgba(28, 28, 28, 0.31);
  box-shadow: inset 0px 6px 8.4px 1px rgba(0, 0, 0, 0.08);
  border-radius: 46px;
  padding: 38px 62px 38px 62px;
  font-family: var(--font-manrope), monospace;
  font-size: 18px;
  color: var(--foreground);
  outline: none;
  resize: none;
  word-wrap: break-word;
}

/* Auto-resize Implementation */
textarea {
  /* JavaScript-driven height calculation */
  field-sizing: content; /* Modern browser support */
  /* Fallback: Programmatic height setting */
}
```

### Panel and Container Patterns

**Canvas Panel Pattern:**
```css
.canvas-panel {
  height: 56vh;
  border-radius: 2.875rem;
  border: 0.625rem solid var(--border-default);
  overflow: hidden;
}

.canvas-container {
  width: 60vw;
  background: var(--border-default);
  box-shadow: 0px -5px 17.9px 5px rgba(0, 0, 0, 0.18);
}
```

**Tool Panel Pattern:**
```css
.tool-panel {
  height: 88.1vh;
  border: 10px solid var(--border-default);
  border-radius: 71px;
  background: rgba(255, 255, 255, 0.01);
  box-shadow: 0px -5px 14.8px 5px rgba(0, 0, 0, 0.08),
              inset 0px -5px 15.5px 9px rgba(0, 0, 0, 0.09);
  padding: 2.1vw 4.75vw 2.05vw;
}
```

### Empty State Patterns

**Tool Canvas Empty State:**
```css
.empty-state-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--border-default);
}

.empty-state-icon {
  width: 16vw;
  height: 16vw;
  margin-bottom: 1.25vw;
  opacity: 0.5;
}

.empty-state-text {
  font-size: 14px;
  color: var(--foreground);
  opacity: 0.7;
}
```

## Interactive Elements

### Hover and Focus States

**Universal Hover Pattern:**
```css
.interactive-element:hover {
  color: white;
  transition: color 0.2s ease-in-out;
}

.interactive-element:focus {
  outline: 2px solid var(--border-active);
  outline-offset: 2px;
}
```

**Button State Progression:**
```css
.button-primary {
  /* Default State */
  color: var(--foreground);
  background: transparent;
  border: 1px solid var(--border-default);
  transition: all 0.3s ease;
}

.button-primary:hover {
  /* Hover State */
  color: white;
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-active);
}

.button-primary:active {
  /* Active State */
  transform: translateY(1px);
  box-shadow: 0px -1px 5px rgba(0, 0, 0, 0.2);
}

.button-primary:disabled {
  /* Disabled State */
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Loading States

**Spinner Animation:**
```css
.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--foreground);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

**Process Button States:**
```css
.processing-button {
  /* Dynamic state changes */
  opacity: var(--processing-opacity);
  pointer-events: none;
}

.processing-button::before {
  content: '';
  background: var(--processing-color);
  /* Inserted via ::before pseudo-element */
}
```

### Validation and Error States

**Input Validation:**
```css
.input-error {
  border-color: var(--error-color);
  background-color: rgba(239, 68, 68, 0.05);
}

.input-success {
  border-color: var(--success-color);
  background-color: rgba(16, 185, 129, 0.05);
}
```

## Animation and Motion

### Transition Patterns

**Micro-Interactions:**
```css
/* Element transitions */
.interactive-transition {
  transition: all 0.2s ease-in-out;
}

/* State changes */
.slide-transition {
  transition: transform 0.3s ease-out;
}

/* Opacity changes */
.fade-transition {
  transition: opacity 0.15s ease-in;
}
```

### Canvas Rendering Animations

**Smooth Image Updates:**
```javascript
// Canvas pixel manipulation with frame smoothing
function smoothCanvasUpdate(newImageData) {
  // RequestAnimationFrame for 60fps updates
  requestAnimationFrame(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.putImageData(newImageData, 0, 0);
  });
}
```

### Performance Considerations

**Animation Optimization:**
- **GPU Acceleration**: CSS transforms for hardware acceleration
- **Frame Rate Management**: 60fps target for smooth interactions
- **Critical Path Protection**: Non-blocking animation execution
- **Memory Management**: Proper cleanup of animation resources

## Icon System Integration

### Lucide Icon Integration

**Global Availability:**
```html
<head>
  <!-- Global icon loading -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
```

**Runtime Icon Creation:**
```javascript
// Global initialization
lucide.createIcons();

// Pattern for icon usage in generated tools
const iconElement = document.createElement('i');
iconElement.setAttribute('data-lucide', 'brightness');
lucide.createIcons(); // Initialize new icons
```

**Icon Styling Classes:**
```css
.dynaimg-icon {
  width: 24px;
  height: 24px;
  color: var(--foreground);
  cursor: pointer;
  transition: color 0.2s;
}

.dynaimg-icon:hover {
  color: white;
}

.dynaimg-icon-group {
  display: flex;
  gap: 2vw;
}
```

### Icon Usage Guidelines

**Standard Icon Mapping:**
- **Flip Horizontal**: `flip-horizontal`
- **Flip Vertical**: `flip-vertical`
- **Rotate**: `rotate-cw` (clockwise) / `rotate-ccw` (counter-clockwise)
- **Zoom**: `zoom-in` / `zoom-out`
- **Save**: `download`
- **Reset**: `refresh-cw`

**Size Consistency:**
- **Primary Controls**: `w-6 h-6` (24px)
- **Smaller Elements**: `w-4 h-4` (16px)
- **Large Areas**: `w-8 h-8` (32px)

### Dynamic Icon Generation

**AI-Generated Icon Usage:**
```html
<!-- Pattern for generated tools -->
<div class="dynaimg-icon-group">
  <i data-lucide="flip-horizontal" class="dynaimg-icon"></i>
  <i data-lucide="flip-vertical" class="dynaimg-icon"></i>
</div>

<script>
  // Mandatory icon initialization
  lucide.createIcons();

  // Event handlers for icon interactions
  document.querySelectorAll('.dynaimg-icon').forEach(icon => {
    icon.addEventListener('click', function() {
      // Icon-specific functionality
    });
  });
</script>
```

This comprehensive design system ensures that all AI-generated tools maintain perfect visual consistency while providing the flexibility needed for diverse user interactions. The system scales seamlessly from simple slider controls to complex multi-element interfaces, all maintaining the same professional appearance and behavior patterns.