'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useImageContext } from '../../contexts/ImageContext';

function computeHistograms(imageData) {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const l = new Array(256).fill(0);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const R = d[i];
    const G = d[i + 1];
    const B = d[i + 2];
    r[R]++;
    g[G]++;
    b[B]++;
    const Y = Math.round(0.2126 * R + 0.7152 * G + 0.0722 * B);
    l[Y]++;
  }
  return { r, g, b, l };
}

export default function HistogramTool() {
  const { canvasEditor, imageVersion } = useImageContext();
  const plotRef = useRef(null);

  const bins = useMemo(() => Array.from({ length: 256 }, (_, i) => i), []);

  useEffect(() => {
    const Plotly = typeof window !== 'undefined' ? window.Plotly : null;
    if (!Plotly || !canvasEditor?.getImageData || !plotRef.current) return;
    const img = canvasEditor.getImageData();
    if (!img) return;
    const { r, g, b, l } = computeHistograms(img);

    const traces = [
      {
        x: bins,
        y: r,
        type: 'bar',
        name: 'Red',
        marker: { color: 'rgba(239,68,68,0.6)' },
        hovertemplate: 'R %{x}: %{y}<extra></extra>',
      },
      {
        x: bins,
        y: g,
        type: 'bar',
        name: 'Green',
        marker: { color: 'rgba(16,185,129,0.6)' },
        hovertemplate: 'G %{x}: %{y}<extra></extra>',
      },
      {
        x: bins,
        y: b,
        type: 'bar',
        name: 'Blue',
        marker: { color: 'rgba(59,130,246,0.6)' },
        hovertemplate: 'B %{x}: %{y}<extra></extra>',
      },
      {
        x: bins,
        y: l,
        type: 'scatter',
        mode: 'lines',
        name: 'Luma',
        line: { color: '#e5e7eb', width: 2 },
        hovertemplate: 'L %{x}: %{y}<extra></extra>',
      },
    ];

    const layout = {
      autosize: true,
      height: 220,
      margin: { l: 30, r: 10, t: 10, b: 30 },
      paper_bgcolor: '#3b3b3b',
      plot_bgcolor: '#3b3b3b',
      font: { color: '#aeaeae', family: 'Manrope, sans-serif' },
      barmode: 'overlay',
      xaxis: {
        range: [0, 255],
        gridcolor: '#515050',
        zerolinecolor: '#515050',
        tickfont: { size: 10 },
      },
      yaxis: {
        gridcolor: '#515050',
        zerolinecolor: '#515050',
        tickfont: { size: 10 },
      },
      showlegend: true,
      legend: { orientation: 'h', y: -0.2, x: 0 },
    };

    const config = { displayModeBar: false, responsive: true };
    Plotly.react(plotRef.current, traces, layout, config);
  }, [canvasEditor, imageVersion, bins]);

  return (
    <div className="w-full rounded-2xl border border-[#515050] p-4">
      <div className="dynaimg-section-spacing">
        <div className="dynaimg-section-header">Histogram</div>
        <div ref={plotRef} className="w-full" style={{ height: 220 }} />
      </div>
    </div>
  );
}

