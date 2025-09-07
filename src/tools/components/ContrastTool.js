'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useImageContext } from '../../contexts/ImageContext';

export default function ContrastTool({ id, initialContrast = 0 }) {
  const { canvasEditor, imageVersion } = useImageContext();
  const originalRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [contrast, setContrast] = useState(initialContrast); // -100..100

  const ensureOriginal = useCallback(() => {
    if (!canvasEditor?.canvas) return null;
    if (!originalRef.current) {
      const imgData = canvasEditor.getImageData();
      if (imgData) originalRef.current = imgData;
    }
    return originalRef.current;
  }, [canvasEditor]);

  const applyAdjustment = useCallback((cVal) => {
    const original = ensureOriginal();
    if (!original || !canvasEditor?.putImageData) return;

    const { width, height, data } = original;
    const newData = new ImageData(new Uint8ClampedArray(data), width, height);
    const d = newData.data;

    const contrastValue = Math.max(-100, Math.min(100, cVal));
    const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));

    for (let i = 0; i < d.length; i += 4) {
      let r = factor * (d[i] - 128) + 128;
      let g = factor * (d[i + 1] - 128) + 128;
      let b = factor * (d[i + 2] - 128) + 128;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
    }

    canvasEditor.putImageData(newData);
  }, [canvasEditor, ensureOriginal]);

  useEffect(() => {
    applyAdjustment(contrast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contrast]);

  const reset = () => {
    if (originalRef.current && canvasEditor?.putImageData) {
      canvasEditor.putImageData(originalRef.current);
    }
    originalRef.current = null;
    setContrast(0);
  };

  const valueLabel = `${contrast > 0 ? '+' : ''}${contrast}%`;

  return (
    <div className="w-full rounded-2xl border border-[#515050] p-4">
      <div className="dynaimg-section-spacing">
        <div className="dynaimg-slider-container">
          <span className="dynaimg-text">Contrast</span>
          {/* <button onClick={reset} className="text-xs text-[#aeaeae] hover:text-white">Reset</button> */}
          <span className="dynaimg-text">{valueLabel}</span>
        </div>
        <div className="dynaimg-slider-wrapper">
          <input
            type="range"
            min={-100}
            max={100}
            value={contrast}
            onPointerDown={() => {
              isDraggingRef.current = true;
              originalRef.current = canvasEditor.getImageData();
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
              originalRef.current = null;
            }}
            onChange={(e) => setContrast(parseInt(e.target.value, 10))}
            className="dynaimg-slider"
          />
        </div>
      </div>
    </div>
  );
}
