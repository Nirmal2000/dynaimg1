import BrightnessTool from './components/BrightnessTool';
import ContrastTool from './components/ContrastTool';
import HueTool from './components/HueTool';
import SaturationTool from './components/SaturationTool';
import RotateTool from './components/RotateTool';
import FiltersTool from './components/FiltersTool';
import TintTool from './components/TintTool';
import HistogramTool from './components/HistogramTool';

// Simple registry of prebuilt tools. Each entry defines metadata and component.
export const ToolRegistry = {
  brightness: {
    type: 'brightness',
    name: 'Brightness',
    icon: 'sun',
    component: BrightnessTool,
    defaultProps: { initialBrightness: 0 },
  },
  contrast: {
    type: 'contrast',
    name: 'Contrast',
    icon: 'contrast',
    component: ContrastTool,
    defaultProps: { initialContrast: 0 },
  },
  hue: {
    type: 'hue',
    name: 'Hue',
    icon: 'palette',
    component: HueTool,
    defaultProps: { initialHue: 0 },
  },
  saturation: {
    type: 'saturation',
    name: 'Saturation',
    icon: 'droplet',
    component: SaturationTool,
    defaultProps: { initialSaturation: 0 },
  },
  rotate: {
    type: 'rotate',
    name: 'Rotate',
    icon: 'rotate-cw',
    component: RotateTool,
    defaultProps: {},
  },
  filters: {
    type: 'filters',
    name: 'Filters',
    icon: 'image',
    component: FiltersTool,
    defaultProps: {},
  },
  tint: {
    type: 'tint',
    name: 'Tint',
    icon: 'droplets',
    component: TintTool,
    defaultProps: { initialColor: '#66ccff', initialStrength: 20 },
  },
  histogram: {
    type: 'histogram',
    name: 'Histogram',
    icon: 'bar-chart-3',
    component: HistogramTool,
    defaultProps: {},
  },
};

export function getToolDefinition(type) {
  return ToolRegistry[type] || null;
}
