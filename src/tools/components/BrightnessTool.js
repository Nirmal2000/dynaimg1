'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useImageContext } from '../../contexts/ImageContext';

export default function BrightnessTool({ id, initialBrightness = 0 }) {
  const { canvasEditor, imageVersion } = useImageContext();
  const originalRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [brightness, setBrightness] = useState(initialBrightness); // -100..100

  const ensureOriginal = useCallback(() => {
    if (!canvasEditor?.canvas) return null;
    if (!originalRef.current) {
      const imgData = canvasEditor.getImageData();
      if (imgData) originalRef.current = imgData;
    }
    return originalRef.current;
  }, [canvasEditor]);

  const applyAdjustment = useCallback((bVal) => {
    const original = ensureOriginal();
    if (!original || !canvasEditor?.putImageData) return;

    const { width, height, data } = original;
    const newData = new ImageData(new Uint8ClampedArray(data), width, height);
    const d = newData.data;

    const brightnessValue = Math.max(-100, Math.min(100, bVal)) * 255 / 100;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] + brightnessValue;
      let g = d[i + 1] + brightnessValue;
      let b = d[i + 2] + brightnessValue;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
    }

    canvasEditor.putImageData(newData);
  }, [canvasEditor, ensureOriginal]);

  useEffect(() => {
    applyAdjustment(brightness);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brightness]);

  const reset = () => {
    if (originalRef.current && canvasEditor?.putImageData) {
      canvasEditor.putImageData(originalRef.current);
    }
    originalRef.current = null;
    setBrightness(0);
  };

  const valueLabel = `${brightness > 0 ? '+' : ''}${brightness}%`;

  return (
    <div className="w-full rounded-2xl border border-[#515050] p-4">
      <div className="dynaimg-section-spacing">
        <div className="dynaimg-slider-container">
          <span className="dynaimg-text">Brightness</span>
          {/* <button onClick={reset} className="text-xs text-[#aeaeae] hover:text-white">Reset</button> */}
          <span className="dynaimg-text">{valueLabel}</span>
        </div>
        <div className="dynaimg-slider-wrapper">
          <input
            type="range"
            min={-100}
            max={100}
            value={brightness}
            onPointerDown={() => {
              isDraggingRef.current = true;
              // capture baseline at interaction start
              originalRef.current = canvasEditor.getImageData();
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
              // clear baseline so a future interaction rebases to latest
              originalRef.current = null;
            }}
            onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
            className="dynaimg-slider"
          />
        </div>
      </div>
    </div>
  );
}
