'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export default function HueTool({ id, initialHue = 0 }) {
  const { canvasEditor, imageVersion } = useImageContext();
  const originalRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [hue, setHue] = useState(initialHue); // -180..180

  const ensureOriginal = useCallback(() => {
    if (!canvasEditor?.canvas) return null;
    if (!originalRef.current) {
      const imgData = canvasEditor.getImageData();
      if (imgData) originalRef.current = imgData;
    }
    return originalRef.current;
  }, [canvasEditor]);

  const applyAdjustment = useCallback((hueDeg) => {
    const original = ensureOriginal();
    if (!original || !canvasEditor?.putImageData) return;

    const { width, height, data } = original;
    const newData = new ImageData(new Uint8ClampedArray(data), width, height);
    const d = newData.data;
    const hueShift = (hueDeg % 360) / 360; // -0.5..0.5

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      let [h, s, l] = rgbToHsl(r, g, b);
      h = (h + hueShift + 1) % 1;
      const [nr, ng, nb] = hslToRgb(h, s, l);
      d[i] = nr; d[i + 1] = ng; d[i + 2] = nb;
    }

    canvasEditor.putImageData(newData);
  }, [canvasEditor, ensureOriginal]);

  useEffect(() => {
    applyAdjustment(hue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hue]);

  // const reset = () => {
  //   if (originalRef.current && canvasEditor?.putImageData) {
  //     canvasEditor.putImageData(originalRef.current);
  //   }
  //   originalRef.current = null;
  //   setHue(0);
  // };

  const valueLabel = `${hue}°`;

  return (
    <div className="dynaimg-tool-section">
      <div className="dynaimg-section-spacing">
        <div className="dynaimg-slider-container">
          <span className="dynaimg-text">Hue</span>
          {/* <button onClick={reset} className="text-xs text-[#aeaeae] hover:text-white">Reset</button> */}
          <span className="dynaimg-text">{valueLabel}</span>
        </div>
        <div className="dynaimg-slider-wrapper">
          <input
            type="range"
            min={-180}
            max={180}
            value={hue}
            onPointerDown={() => {
              isDraggingRef.current = true;
              originalRef.current = canvasEditor.getImageData();
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
              originalRef.current = null;
            }}
            onChange={(e) => setHue(parseInt(e.target.value, 10))}
            className="dynaimg-slider"
          />
        </div>
      </div>
    </div>
  );
}
