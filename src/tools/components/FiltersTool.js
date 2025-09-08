'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import { RefreshCcw } from 'lucide-react';

function clamp255(v) { return Math.max(0, Math.min(255, v)); }

export default function FiltersTool({ id, preset }) {
  const { canvasEditor, getCurrentImageDataUrl, imageVersion } = useImageContext();
  const originalRef = useRef(null); // baseline when tool mounted
  const [active, setActive] = useState(preset || null); // 'grayscale' | 'negative' | 'sepia' | null
  const [thumb, setThumb] = useState('');

  // Capture a thumbnail of the current canvas once on mount
  useEffect(() => {
    try {
      const url = getCurrentImageDataUrl?.();
      if (url) setThumb(url);
      // Capture pixel baseline exactly at tool start
      const imgData = canvasEditor?.getImageData?.();
      if (imgData) originalRef.current = imgData;
    } catch {}
    // We intentionally only capture on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to any external canvas changes (e.g., Google edit tool or other tools)
  useEffect(() => {
    try {
      const url = getCurrentImageDataUrl?.();
      if (url) setThumb(url);
      const imgData = canvasEditor?.getImageData?.();
      if (imgData) originalRef.current = imgData; // rebase to latest image
    } catch {}
  }, [imageVersion, canvasEditor, getCurrentImageDataUrl]);

  const ensureOriginal = useCallback(() => {
    if (!canvasEditor?.canvas) return null;
    if (!originalRef.current) {
      const imgData = canvasEditor.getImageData();
      if (imgData) originalRef.current = imgData;
    }
    return originalRef.current;
  }, [canvasEditor]);

  const applyFilter = useCallback((type) => {
    const original = ensureOriginal();
    if (!original || !canvasEditor?.putImageData) return;

    const { width, height, data } = original;
    const newData = new ImageData(new Uint8ClampedArray(data), width, height);
    const d = newData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      let nr = r, ng = g, nb = b;
      if (type === 'grayscale') {
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        nr = ng = nb = y;
      } else if (type === 'negative') {
        nr = 255 - r; ng = 255 - g; nb = 255 - b;
      } else if (type === 'sepia') {
        nr = 0.393 * r + 0.769 * g + 0.189 * b;
        ng = 0.349 * r + 0.686 * g + 0.168 * b;
        nb = 0.272 * r + 0.534 * g + 0.131 * b;
      }
      d[i] = clamp255(nr);
      d[i + 1] = clamp255(ng);
      d[i + 2] = clamp255(nb);
    }

    setActive(type);
    canvasEditor.putImageData(newData);
  }, [canvasEditor, ensureOriginal]);

  const tileClass = 'dynaimg-filter-button group transition-all duration-200 hover:bg-[rgba(66,66,66,0.4)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--border-active)] focus:ring-offset-0';

  const tileStyle = useMemo(() => ({
    width: 75, height: 75, border: '8px solid var(--border-default)', borderRadius: 15,
    overflow: 'hidden', position: 'relative', boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }), []);

  const imgStyleBase = {
    width: '100%', height: '100%', objectFit: 'cover'
  };

  return (
    <div className="dynaimg-tool-section">
      <div className="dynaimg-section-spacing">
        <div className="dynaimg-section-header">Filters</div>
        <div className="flex gap-[1.25vw]">
          {/* Grayscale */}
          <button
            type="button"
            onClick={() => applyFilter('grayscale')}
            className={tileClass + (active === 'grayscale' ? ' active' : '')}
            style={{ ...tileStyle, borderColor: active === 'grayscale' ? 'var(--border-active)' : 'var(--border-default)' }}
            aria-label="Grayscale filter"
          >
            {thumb && (
              // Use CSS filter for preview only
              <img src={thumb} alt="grayscale preview" style={{ ...imgStyleBase, filter: 'grayscale(1)' }} />
            )}
          </button>

          {/* Negative */}
          <button
            type="button"
            onClick={() => applyFilter('negative')}
            className={tileClass + (active === 'negative' ? ' active' : '')}
            style={{ ...tileStyle, borderColor: active === 'negative' ? 'var(--border-active)' : 'var(--border-default)' }}
            aria-label="Negative filter"
          >
            {thumb && (
              <img src={thumb} alt="negative preview" style={{ ...imgStyleBase, filter: 'invert(1)' }} />
            )}
          </button>

          {/* Sepia */}
          <button
            type="button"
            onClick={() => applyFilter('sepia')}
            className={tileClass + (active === 'sepia' ? ' active' : '')}
            style={{ ...tileStyle, borderColor: active === 'sepia' ? 'var(--border-active)' : 'var(--border-default)' }}
            aria-label="Sepia filter"
          >
            {thumb && (
              <img src={thumb} alt="sepia preview" style={{ ...imgStyleBase, filter: 'sepia(1)' }} />
            )}
          </button>

          {/* Reset to baseline (last) */}
          <button
            type="button"
            onClick={() => {
              if (originalRef.current && canvasEditor?.putImageData) {
                canvasEditor.putImageData(originalRef.current);
                setActive(null);
              }
            }}
            className={tileClass + (active === null ? ' active' : '')}
            style={{ ...tileStyle, borderColor: active === null ? 'var(--border-active)' : 'var(--border-default)' }}
            aria-label="Reset filter"
            title="Reset"
          >
            <RefreshCcw className="w-6 h-6 text-[var(--foreground)] group-hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
