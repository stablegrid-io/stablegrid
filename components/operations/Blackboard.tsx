'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Trash2, Pencil, Minus, Circle } from 'lucide-react';

const CHALK_COLORS = [
  { label: 'White', value: 'rgba(230,240,235,0.9)' },
  { label: 'Green', value: 'rgba(80,220,160,0.85)' },
  { label: 'Amber', value: 'rgba(240,192,64,0.85)' },
  { label: 'Red',   value: 'rgba(240,80,80,0.85)' },
  { label: 'Blue',  value: 'rgba(80,180,240,0.85)' },
];

const STROKE_SIZES = [2, 4, 8];

interface Point { x: number; y: number }

export function Blackboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);

  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [color, setColor] = useState(CHALK_COLORS[0].value);
  const [size, setSize] = useState(3);
  const [collapsed, setCollapsed] = useState(false);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement): Point => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawStroke = useCallback((from: Point, to: Point, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);

    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = size * 6;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      // Chalk texture: slight opacity jitter via shadow
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 0.6;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [mode, color, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      lastPoint.current = getPos(e, canvas);
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const ctx = getCtx();
      if (!ctx || !lastPoint.current) return;
      const curr = getPos(e, canvas);
      drawStroke(lastPoint.current, curr, ctx);
      lastPoint.current = curr;
    };

    const onUp = () => {
      drawing.current = false;
      lastPoint.current = null;
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }, [drawStroke]);

  const clear = () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  };

  return (
    <div
      className="relative overflow-hidden rounded-[10px] border"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        background: 'rgba(6,10,8,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset, 0 20px 60px -20px rgba(0,0,0,0.8)',
      }}
    >
      {/* Top stripe */}
      <div className="h-[1px] w-full bg-[#1e2e26]" />
      {/* Corner brackets */}
      <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-[#1e3028]" />
      <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-[#1e3028]" />
      {!collapsed && <>
        <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#1e3028]" />
        <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#1e3028]" />
      </>}

      {/* Header toolbar */}
      <div className="flex items-center gap-3 px-5 py-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-[#2a4038]">
          Scratchpad
        </p>

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Color swatches */}
          {!collapsed && CHALK_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => { setColor(c.value); setMode('draw'); }}
              className="h-3.5 w-3.5 rounded-full transition-all duration-150"
              style={{
                backgroundColor: c.value,
                outline: color === c.value && mode === 'draw' ? `2px solid ${c.value}` : '2px solid transparent',
                outlineOffset: '2px',
                opacity: color === c.value && mode === 'draw' ? 1 : 0.45,
              }}
              title={c.label}
            />
          ))}

          {!collapsed && (
            <>
              <div className="mx-1 h-3 w-px bg-white/10" />
              {/* Stroke sizes */}
              {STROKE_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className="flex h-6 w-6 items-center justify-center rounded-[4px] transition-all duration-150"
                  style={{ background: size === s ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                  title={`Size ${s}`}
                >
                  <div
                    className="rounded-full bg-white/60"
                    style={{ width: s + 2, height: s + 2 }}
                  />
                </button>
              ))}

              <div className="mx-1 h-3 w-px bg-white/10" />

              {/* Erase toggle */}
              <button
                type="button"
                onClick={() => setMode(mode === 'erase' ? 'draw' : 'erase')}
                className="flex h-6 w-6 items-center justify-center rounded-[4px] transition-all duration-150"
                style={{ background: mode === 'erase' ? 'rgba(240,192,64,0.15)' : 'transparent' }}
                title="Eraser"
              >
                <Eraser className="h-3.5 w-3.5" style={{ color: mode === 'erase' ? '#f0c040' : 'rgba(255,255,255,0.3)' }} />
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={clear}
                className="flex h-6 w-6 items-center justify-center rounded-[4px] transition-all duration-150 hover:bg-white/5"
                title="Clear"
              >
                <Trash2 className="h-3.5 w-3.5 text-white/30 hover:text-white/60 transition-colors" />
              </button>
            </>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="ml-1 flex h-6 items-center gap-1 rounded-[4px] px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/25 transition-colors hover:text-white/50"
          >
            {collapsed ? 'show' : 'hide'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <div
            className="overflow-hidden rounded-[6px]"
            style={{
              background: 'rgba(4,8,6,1)',
              border: '1px solid rgba(255,255,255,0.04)',
              cursor: mode === 'erase' ? 'cell' : 'crosshair',
            }}
          >
            <canvas
              ref={canvasRef}
              width={900}
              height={300}
              className="block w-full touch-none"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
          <p className="mt-2 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-white/10">
            Draw · Calculate · Sketch
          </p>
        </div>
      )}
    </div>
  );
}
