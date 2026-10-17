"use client";

import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type Size = { width: number; height: number };

const MARCO_CLASES = {
  "4/3": "max-w-md aspect-[4/3]",
  "1/1": "max-w-sm aspect-square",
} as const;

export default function FocalPointModal({
  image,
  onSave,
  onCancel,
  aspecto = "4/3",
  nota,
}: {
  image: { previewUrl: string; focalX: number; focalY: number };
  onSave: (focalX: number, focalY: number) => void;
  onCancel: () => void;
  aspecto?: keyof typeof MARCO_CLASES;
  nota?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const [frameSize, setFrameSize] = useState<Size | null>(null);
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setFrameSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget;
    setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight });
  }

  const scale =
    frameSize && naturalSize
      ? Math.max(
          frameSize.width / naturalSize.width,
          frameSize.height / naturalSize.height
        )
      : 1;
  const renderedWidth = naturalSize ? naturalSize.width * scale : 0;
  const renderedHeight = naturalSize ? naturalSize.height * scale : 0;
  const excessX = frameSize ? Math.max(0, renderedWidth - frameSize.width) : 0;
  const excessY = frameSize
    ? Math.max(0, renderedHeight - frameSize.height)
    : 0;

  const offset = dragOffset ?? {
    x: -excessX * (image.focalX / 100),
    y: -excessY * (image.focalY / 100),
  };

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (excessX === 0 && excessY === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStateRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !dragStateRef.current) return;
    const { startClientX, startClientY, startOffsetX, startOffsetY } =
      dragStateRef.current;
    setDragOffset({
      x: clamp(startOffsetX + (e.clientX - startClientX), -excessX, 0),
      y: clamp(startOffsetY + (e.clientY - startClientY), -excessY, 0),
    });
  }

  function handlePointerUp() {
    setIsDragging(false);
    dragStateRef.current = null;
  }

  const focalX = excessX > 0 ? clamp((-offset.x / excessX) * 100, 0, 100) : 50;
  const focalY = excessY > 0 ? clamp((-offset.y / excessY) * 100, 0, 100) : 50;
  const canDrag = excessX > 0 || excessY > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a] mb-1">
          Ajustar recorte
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Arrastrá la imagen dentro del marco para elegir qué parte se ve
          siempre en los recortes.
        </p>
        {nota && (
          <p className="text-xs text-text-secondary -mt-2 mb-4">{nota}</p>
        )}

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full mx-auto ${MARCO_CLASES[aspecto]} overflow-hidden bg-bg-alt rounded-sm select-none ${
            canDrag ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          style={{ touchAction: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt=""
            draggable={false}
            onLoad={handleImageLoad}
            className="absolute pointer-events-none select-none"
            style={{
              width: renderedWidth || undefined,
              height: renderedHeight || undefined,
              left: offset.x,
              top: offset.y,
              maxWidth: "none",
              maxHeight: "none",
            }}
          />
        </div>

        <div className="flex items-center gap-4 mt-6">
          <button
            type="button"
            onClick={() => onSave(focalX, focalY)}
            className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-2.5 hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
