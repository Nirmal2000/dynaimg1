'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import { HexColorPicker } from 'react-colorful';
import { RefreshCcw } from 'lucide-react';

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export default function TintTool({ id, initialColor = '#66ccff', initialStrength = 20 }) {
  const { canvasEditor } = useImageContext();
  const originalRef = useRef(null);           // interaction baseline
  const toolStartRef = useRef(null);           // reset-to baseline
  const isDraggingRef = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const swatchRef = useRef(null);
  const [strength, setStrength] = useState(initialStrength); // 0..100
  const [color, setColor] = useState(initialColor); // hex string

  const ensureOriginal = useCallback(() => {
    if (!canvasEditor?.canvas) return null;
    if (!originalRef.current) {
      const imgData = canvasEditor.getImageData();
      if (imgData) originalRef.current = imgData;
    }
    return originalRef.current;
  }, [canvasEditor]);

  const applyTint = useCallback((hex, pct) => {
    const original = ensureOriginal();
    if (!original || !canvasEditor?.putImageData) return;

    const { width, height, data } = original;
    const newData = new ImageData(new Uint8ClampedArray(data), width, height);
    const d = newData.data;
    const { r: tr, g: tg, b: tb } = hexToRgb(hex);
    const a = Math.max(0, Math.min(100, pct)) / 100; // 0..1

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      d[i] = Math.round((1 - a) * r + a * tr);
      d[i + 1] = Math.round((1 - a) * g + a * tg);
      d[i + 2] = Math.round((1 - a) * b + a * tb);
    }

    canvasEditor.putImageData(newData);
  }, [canvasEditor, ensureOriginal]);

  // Update on strength changes
  useEffect(() => {
    applyTint(color, strength);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strength]);

  // Update on color changes
  useEffect(() => {
    applyTint(color, strength);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  // Capture tool-start baseline for reset
  useEffect(() => {
    try {
      const imgData = canvasEditor?.getImageData?.();
      if (imgData) toolStartRef.current = imgData;
    } catch {}
    // only at mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close picker on outside click or Escape
  useEffect(() => {
    if (!pickerOpen) return;
    const handleDown = (e) => {
      const p = pickerRef.current;
      const s = swatchRef.current;
      if (p && !p.contains(e.target) && s && !s.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [pickerOpen]);

  const valueLabel = `${strength}%`;

  return (
    <div className="dynaimg-tool-section">
      <div className="dynaimg-section-spacing">
        <div className="dynaimg-slider-container">
          <span className="dynaimg-text">Tint</span>
          <span className="dynaimg-text">{valueLabel}</span>
        </div>
        <div className="dynaimg-slider-wrapper flex items-center gap-[1.25vw]">
          <input
            type="range"
            min={0}
            max={100}
            value={strength}
            onPointerDown={() => {
              isDraggingRef.current = true;
              originalRef.current = canvasEditor.getImageData();
            }}
            onPointerUp={() => {
              isDraggingRef.current = false;
              originalRef.current = null; // rebase for next interaction
            }}
            onChange={(e) => setStrength(parseInt(e.target.value, 10))}
            className="dynaimg-slider flex-1"
          />

          {/* Color swatch picker with popover */}
          <div className="relative w-[60px] h-[60px]">
            <button
              type="button"
              aria-label="Choose tint color"
              onClick={() => {
                if (!pickerOpen) {
                  // opening: capture baseline for this interaction
                  originalRef.current = canvasEditor.getImageData();
                } else {
                  // closing: clear interaction baseline
                  originalRef.current = null;
                }
                setPickerOpen((v) => !v);
              }}
              ref={swatchRef}
              className="dynaimg-filter-button group"
              style={{
                width: 60,
                height: 60,
                border: '8px solid var(--border-default)',
                borderRadius: 15,
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: color,
              }}
              title="Pick color"
            />
          </div>

          {/* Reset tile restores image to tool-start state and zeroes strength */}
          <button
            type="button"
            aria-label="Reset tint"
            onClick={() => {
              if (toolStartRef.current && canvasEditor?.putImageData) {
                canvasEditor.putImageData(toolStartRef.current);
                setStrength(0);
                // keep current color but close picker
                setPickerOpen(false);
                originalRef.current = null;
              }
            }}
            className="dynaimg-filter-button group"
            style={{
              width: 60,
              height: 60,
              border: '8px solid var(--border-default)',
              borderRadius: 15,
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(61,61,61,0.01)'
            }}
            title="Reset"
          >
            <RefreshCcw className="w-6 h-6 text-[var(--foreground)] group-hover:text-white" />
          </button>
        </div>

        {pickerOpen && (
          <div className="w-full mt-4 flex justify-center">
            <div
              ref={pickerRef}
              className="p-4 rounded-2xl border border-[var(--border-default)] bg-[rgba(28,28,28,0.96)] shadow-[0px_20px_40px_rgba(0,0,0,0.5)]"
              style={{ width: 280, maxWidth: 'min(92vw, 420px)' }}
            >
              <HexColorPicker color={color} onChange={setColor} style={{ width: '100%' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
