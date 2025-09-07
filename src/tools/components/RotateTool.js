'use client';

import { useCallback, useMemo } from 'react';
import { useImageContext } from '../../contexts/ImageContext';
import { RotateCcw, RotateCw } from 'lucide-react';

export default function RotateTool() {
  const { canvasEditor } = useImageContext();

  const rotate = useCallback((direction) => {
    const canvas = canvasEditor?.canvas;
    const ctx = canvasEditor?.ctx;
    if (!canvas || !ctx) return;

    const angle = direction === 'cw' ? 90 : -90;
    const radians = (angle * Math.PI) / 180;

    const w = canvas.width;
    const h = canvas.height;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    off.getContext('2d').drawImage(canvas, 0, 0);

    const newW = h;
    const newH = w;
    canvas.width = newW;
    canvas.height = newH;

    const c = canvas.getContext('2d');
    c.save();
    c.translate(newW / 2, newH / 2);
    c.rotate(radians);
    c.drawImage(off, -w / 2, -h / 2);
    c.restore();

    canvasEditor.ctx = c;
    // Bump imageVersion for other tools to rebase
    try {
      const data = c.getImageData(0, 0, canvas.width, canvas.height);
      canvasEditor.putImageData(data);
    } catch {}
  }, [canvasEditor]);

  const tileStyle = useMemo(() => ({
    width: 60, height: 60, border: '8px solid var(--border-default)', borderRadius: 15,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--foreground)'
  }), []);

  const iconClass = 'w-6 h-6 transition-colors';

  return (
    <div className="w-full rounded-2xl border border-[#515050] p-4">
      <div className="dynaimg-section-spacing">
        <div className="dynaimg-section-header">Rotate</div>
        <div className="flex gap-[1.25vw]">
          <button
            type="button"
            aria-label="Rotate left"
            onClick={() => rotate('ccw')}
            className="dynaimg-filter-button group transition-all duration-200 hover:bg-[rgba(66,66,66,0.4)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--border-active)] focus:ring-offset-0"
            style={tileStyle}
          >
            <RotateCcw className={`${iconClass} text-[var(--foreground)] group-hover:text-white`} />
          </button>
          <button
            type="button"
            aria-label="Rotate right"
            onClick={() => rotate('cw')}
            className="dynaimg-filter-button group transition-all duration-200 hover:bg-[rgba(66,66,66,0.4)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--border-active)] focus:ring-offset-0"
            style={tileStyle}
          >
            <RotateCw className={`${iconClass} text-[var(--foreground)] group-hover:text-white`} />
          </button>
        </div>
      </div>
    </div>
  );
}
