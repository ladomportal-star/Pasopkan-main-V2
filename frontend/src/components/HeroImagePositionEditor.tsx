import React, { useRef, useState } from 'react';
import { Monitor, Smartphone, Move, RotateCcw, Copy } from 'lucide-react';
import {
  DEFAULT_HERO_IMAGE_POSITION,
  HeroImagePosition,
  heroObjectPosition,
  normalizeHeroImagePosition,
} from '../lib/siteSettings';

export type HeroPreviewMode = 'desktop' | 'mobile';

interface HeroImagePositionEditorProps {
  lang: 'en' | 'lo';
  imageUrl: string;
  mode: HeroPreviewMode;
  onModeChange: (mode: HeroPreviewMode) => void;
  desktopPosition?: HeroImagePosition;
  mobilePosition?: HeroImagePosition;
  onChange: (mode: HeroPreviewMode, position: HeroImagePosition) => void;
  /** Overlay controls (prev/next, dots) rendered above the image. */
  children?: React.ReactNode;
}

/**
 * Frames that mirror the homepage hero box (Home.tsx):
 * - desktop (lg+): ~1184px wide x 1080px tall
 * - mobile: ~350px wide x 220px tall
 */
const FRAME_CLASS: Record<HeroPreviewMode, string> = {
  desktop: 'w-full max-w-[560px] aspect-[1184/1080] rounded-[2rem]',
  mobile: 'w-full max-w-[320px] aspect-[350/220] rounded-[1.5rem]',
};

export default function HeroImagePositionEditor({
  lang,
  imageUrl,
  mode,
  onModeChange,
  desktopPosition,
  mobilePosition,
  onChange,
  children,
}: HeroImagePositionEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    start: HeroImagePosition;
    overflowX: number;
    overflowY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const position = normalizeHeroImagePosition(
    mode === 'desktop' ? desktopPosition : mobilePosition,
  );
  const otherMode: HeroPreviewMode = mode === 'desktop' ? 'mobile' : 'desktop';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img || !img.naturalWidth || !img.naturalHeight) return;
    // Only start a drag on the image itself, not on overlay buttons.
    if ((e.target as HTMLElement).closest('button')) return;
    const rect = frame.getBoundingClientRect();
    const scale = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      start: position,
      overflowX: img.naturalWidth * scale - rect.width,
      overflowY: img.naturalHeight * scale - rect.height,
    };
    frame.setPointerCapture(e.pointerId);
    setDragging(true);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    // Dragging the image right reveals its left side, so the percentage goes down.
    const dx = drag.overflowX > 0.5 ? ((e.clientX - drag.startX) / drag.overflowX) * 100 : 0;
    const dy = drag.overflowY > 0.5 ? ((e.clientY - drag.startY) / drag.overflowY) * 100 : 0;
    onChange(
      mode,
      normalizeHeroImagePosition({ x: drag.start.x - dx, y: drag.start.y - dy }),
    );
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const label = (en: string, lo: string) => (lang === 'en' ? en : lo);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-white/10 p-1">
          {(['desktop', 'mobile'] as const).map((m) => {
            const Icon = m === 'desktop' ? Monitor : Smartphone;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                  mode === m ? 'bg-adv-orange text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {m === 'desktop' ? label('Desktop', 'ຄອມພິວເຕີ') : label('Mobile', 'ມືຖື')}
              </button>
            );
          })}
        </div>
        {imageUrl && (
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
            <Move className="h-3.5 w-3.5" />
            {label('Drag the image to move it', 'ລາກຮູບເພື່ອຍ້າຍຕຳແໜ່ງ')}
          </span>
        )}
      </div>

      {/* Preview frame */}
      <div
        className={`flex justify-center ${
          mode === 'mobile' ? 'rounded-[2.5rem] border-4 border-gray-700 bg-black px-3 py-6 mx-auto max-w-[360px]' : ''
        }`}
      >
        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`relative overflow-hidden bg-gray-800 touch-none select-none ${FRAME_CLASS[mode]} ${
            imageUrl ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''
          }`}
        >
          {imageUrl ? (
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Preview"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: heroObjectPosition(position) }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-xs font-bold text-gray-500">
              No image URL specified
            </div>
          )}
          {dragging && (
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/25" />
              ))}
            </div>
          )}
          {children}
        </div>
      </div>

      {/* Fine controls */}
      {imageUrl && (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          {(['x', 'y'] as const).map((axis) => (
            <label key={axis} className="block">
              <span className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                {axis === 'x' ? label('Horizontal', 'ແນວນອນ') : label('Vertical', 'ແນວຕັ້ງ')}
                <span className="text-gray-300">{Math.round(position[axis])}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={position[axis]}
                onChange={(e) =>
                  onChange(mode, { ...position, [axis]: Number(e.target.value) })
                }
                className="w-full accent-[#f97316]"
              />
            </label>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange(mode, DEFAULT_HERO_IMAGE_POSITION)}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-black text-gray-200 hover:bg-white/10"
              title={label('Center the image', 'ຈັດຮູບໄວ້ກາງ')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {label('Center', 'ກາງ')}
            </button>
            <button
              type="button"
              onClick={() => onChange(otherMode, position)}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-black text-gray-200 hover:bg-white/10"
              title={
                otherMode === 'mobile'
                  ? label('Use this position on mobile too', 'ໃຊ້ຕຳແໜ່ງນີ້ກັບມືຖືນຳ')
                  : label('Use this position on desktop too', 'ໃຊ້ຕຳແໜ່ງນີ້ກັບຄອມນຳ')
              }
            >
              <Copy className="h-3.5 w-3.5" />
              {otherMode === 'mobile' ? label('Copy to mobile', 'ສຳເນົາໄປມືຖື') : label('Copy to desktop', 'ສຳເນົາໄປຄອມ')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
