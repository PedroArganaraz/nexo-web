"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { SitioConfig } from "@/types/database";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const labelClass =
  "block text-xs uppercase tracking-widest text-text-secondary mb-1.5";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type PendingHero = {
  previewUrl: string;
  focalX: number;
  focalY: number;
  // Presente solo si es una selección nueva todavía no subida a storage.
  file?: File;
};

type Size = { width: number; height: number };

// Mismo patrón de interacción que FocalPointModal en ProyectoForm.tsx
// (marco de aspect ratio fijo, imagen a tamaño "cover", arrastre de la
// imagen misma limitado por eje según cuánto sobra en cada uno).
//
// El Hero público (Hero.tsx) es `h-screen w-full` con `fill` + `object-cover`
// — full-bleed a la altura del viewport, sin un aspect ratio fijo real: en
// mobile queda angosto y alto (~9:16), en desktop ancho (~16:9 o más ancho
// todavía en pantallas ultra-wide). No hay una proporción única que lo
// represente con exactitud. Usamos 16:9 (aspect-video) acá como aproximación
// representativa del caso desktop, que es el más común para evaluar el
// encuadre; si hace falta más precisión habría que mostrar dos marcos
// (mobile/desktop) o hacerlo configurable.
function HeroFocalPointModal({
  image,
  onSave,
  onCancel,
}: {
  image: PendingHero;
  onSave: (focalX: number, focalY: number) => void;
  onCancel: () => void;
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
        <h2 className="font-heading font-bold text-lg text-[#1a1a1a] mb-1">
          Ajustar posición
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Arrastrá la imagen dentro del marco para elegir qué parte se ve
          siempre en el hero (aproximación de escritorio, 16:9).
        </p>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full max-w-md mx-auto aspect-video overflow-hidden bg-bg-alt rounded-sm select-none ${
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
            className="text-sm text-text-secondary hover:text-[#1a1a1a] transition-colors duration-200 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortadaForm({
  sitioConfig,
}: {
  sitioConfig: SitioConfig | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const [hero, setHero] = useState<PendingHero | null>(() =>
    sitioConfig?.hero_url
      ? {
          previewUrl: sitioConfig.hero_url,
          focalX: sitioConfig.hero_focal_x,
          focalY: sitioConfig.hero_focal_y,
        }
      : null
  );
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showFocalModal, setShowFocalModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (hero?.file) URL.revokeObjectURL(hero.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Formato no soportado. Convertí la imagen a JPG o PNG antes de subir."
      );
      return;
    }

    setHero((prev) => {
      if (prev?.file) URL.revokeObjectURL(prev.previewUrl);
      return {
        previewUrl: URL.createObjectURL(file),
        focalX: 50,
        focalY: 50,
        file,
      };
    });
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    e.target.value = "";
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDraggingOver(true);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingOver(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }

  function handleSaveFocalPoint(focalX: number, focalY: number) {
    setHero((prev) => (prev ? { ...prev, focalX, focalY } : prev));
    setShowFocalModal(false);
  }

  async function handleSave() {
    if (!hero) {
      toast.error("Subí una imagen para el hero.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      let heroUrl = hero.previewUrl;
      let heroPath = sitioConfig?.hero_path ?? null;

      if (hero.file) {
        const extension = hero.file.name.split(".").pop() || "jpg";
        const path = `sitio/hero/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("proyectos")
          .upload(path, hero.file);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("proyectos").getPublicUrl(path);

        // Reemplazando una imagen existente: borrar la anterior del storage.
        if (sitioConfig?.hero_path) {
          await supabase.storage
            .from("proyectos")
            .remove([sitioConfig.hero_path]);
        }

        heroUrl = publicUrl;
        heroPath = path;
      }

      const { error: upsertError } = await supabase
        .from("sitio_config")
        .upsert({
          id: "default",
          hero_url: heroUrl,
          hero_path: heroPath,
          hero_focal_x: hero.focalX,
          hero_focal_y: hero.focalY,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      toast.success("Portada actualizada correctamente.");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar la portada. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-[#1a1a1a] mb-1">
        Portada
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        Imagen principal en la home pública.
      </p>

      <div>
        <label className={labelClass}>Imagen de Portada</label>

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative"
        >
          {hero ? (
            <div className="relative aspect-video bg-bg-alt rounded-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.previewUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  objectPosition: `${hero.focalX}% ${hero.focalY}%`,
                }}
              />
              {isDraggingOver && (
                <div className="absolute inset-0 flex items-center justify-center border-2 border-solid border-[#1a1a1a] bg-[#1a1a1a]/40 pointer-events-none">
                  <span className="text-sm font-medium text-white uppercase tracking-widest">
                    Soltá para reemplazar
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-video flex flex-col items-center justify-center gap-2 rounded-sm text-center transition-colors duration-150 cursor-pointer ${
                isDraggingOver
                  ? "border-2 border-solid border-[#1a1a1a] bg-[#1a1a1a]/15"
                  : "border-2 border-dashed border-[#999999] hover:border-[#1a1a1a]"
              }`}
            >
              <span
                className={`text-sm transition-colors duration-150 ${
                  isDraggingOver
                    ? "text-[#1a1a1a] font-medium"
                    : "text-[#1a1a1a]"
                }`}
              >
                {isDraggingOver
                  ? "Soltá la imagen acá"
                  : "Arrastrá una imagen acá o hacé click para elegir"}
              </span>
              <span className="text-xs text-text-secondary">
                JPG, PNG o WEBP
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {hero && (
          <div className="flex items-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => setShowFocalModal(true)}
              className="text-sm text-[#1a1a1a] font-medium border border-[#e0e0e0] rounded-full px-5 py-2 hover:bg-bg-alt transition-colors duration-200 cursor-pointer"
            >
              Ajustar posición
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-[#1a1a1a] font-medium border border-[#e0e0e0] rounded-full px-5 py-2 hover:bg-bg-alt transition-colors duration-200 cursor-pointer"
            >
              Reemplazar imagen
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hero}
          className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-8 py-3 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {showFocalModal && hero && (
        <HeroFocalPointModal
          image={hero}
          onSave={handleSaveFocalPoint}
          onCancel={() => setShowFocalModal(false)}
        />
      )}
    </div>
  );
}
