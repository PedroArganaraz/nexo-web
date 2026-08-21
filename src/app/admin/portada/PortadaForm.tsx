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
  // Presente solo si es una selección nueva todavía no subida a storage.
  file?: File;
};

type Focal = { x: number; y: number };

type Size = { width: number; height: number };

// Mismo patrón de interacción que FocalPointModal en ProyectoForm.tsx
// (marco de aspect ratio fijo, imagen a tamaño "cover", arrastre de la
// imagen misma limitado por eje según cuánto sobra en cada uno).
//
// El Hero público (Hero.tsx) es full-bleed a la altura del viewport: en
// mobile queda angosto y alto, en desktop ancho. Por eso este modal se
// parametriza con aspectClassName/description para poder editar el
// encuadre de escritorio (16:9) y el de mobile (más vertical) por separado
// sobre la misma imagen.
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function HeroFocalPointModal({
  image,
  focal,
  zoom,
  aspectClassName,
  description,
  layout = "stacked",
  onSave,
  onCancel,
}: {
  image: PendingHero;
  focal: Focal;
  zoom: number;
  aspectClassName: string;
  description: string;
  // "sideBySide" (usado para Vista Móvil): marco angosto y alto a la
  // izquierda, controles a la derecha, para que el modal quede acotado a
  // la altura del marco en vez de apilar todo debajo de un marco angosto.
  layout?: "stacked" | "sideBySide";
  onSave: (focalX: number, focalY: number, zoom: number) => void;
  onCancel: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
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
  const [zoomValue, setZoomValue] = useState(clamp(zoom, MIN_ZOOM, MAX_ZOOM));

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

  // Si la imagen ya está en caché del navegador, el evento onLoad puede no
  // dispararse (el <img> nace con `complete: true`). Sin este chequeo,
  // naturalSize queda en null y el cálculo de "cover" nunca se aplica,
  // dejando la imagen a su tamaño intrínseco (espacio en blanco en el marco).
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth) {
      setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight });
    }
  }, [image.previewUrl]);

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
    x: -excessX * (focal.x / 100),
    y: -excessY * (focal.y / 100),
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
    // El zoom se aplica como transform visual sobre el marco: el
    // desplazamiento en pantalla queda multiplicado por zoomValue, así que
    // hay que compensarlo para que el arrastre siga el cursor 1 a 1.
    setDragOffset({
      x: clamp(
        startOffsetX + (e.clientX - startClientX) / zoomValue,
        -excessX,
        0
      ),
      y: clamp(
        startOffsetY + (e.clientY - startClientY) / zoomValue,
        -excessY,
        0
      ),
    });
  }

  function handlePointerUp() {
    setIsDragging(false);
    dragStateRef.current = null;
  }

  const focalX = excessX > 0 ? clamp((-offset.x / excessX) * 100, 0, 100) : 50;
  const focalY = excessY > 0 ? clamp((-offset.y / excessY) * 100, 0, 100) : 50;
  const canDrag = excessX > 0 || excessY > 0;
  const isSideBySide = layout === "sideBySide";

  const frame = (
    <div
      ref={frameRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={
        isSideBySide
          ? `relative mx-auto sm:mx-0 shrink-0 ${aspectClassName} overflow-hidden bg-bg-alt rounded-sm border border-[#1a1a1a] select-none ${
              canDrag ? "cursor-grab active:cursor-grabbing" : ""
            }`
          : `relative w-full max-w-md mx-auto ${aspectClassName} overflow-hidden bg-bg-alt rounded-sm border border-[#1a1a1a] select-none ${
              canDrag ? "cursor-grab active:cursor-grabbing" : ""
            }`
      }
      style={
        isSideBySide
          ? { touchAction: "none", height: "min(65vh, 520px)" }
          : { touchAction: "none" }
      }
    >
      {/* Envoltorio que escala desde el centro del marco (transform no
          afecta el tamaño de layout: el overflow-hidden del marco
          recorta cualquier exceso sin desplazar el resto del modal). */}
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${zoomValue})`, transformOrigin: "50% 50%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
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
    </div>
  );

  const zoomControl = (
    <div className="mt-5">
      <label className="flex items-center justify-between text-xs uppercase tracking-widest text-text-secondary mb-1.5">
        <span>Zoom</span>
        <span>{zoomValue.toFixed(1)}x</span>
      </label>
      <input
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.05}
        value={zoomValue}
        onChange={(e) => setZoomValue(Number(e.target.value))}
        className="w-full accent-[#1a1a1a] cursor-pointer"
      />
    </div>
  );

  const actions = (
    <div className="flex items-center gap-4 mt-6">
      <button
        type="button"
        onClick={() => onSave(focalX, focalY, zoomValue)}
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
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className={`bg-white rounded-sm max-h-[90vh] overflow-y-auto p-6 ${
          isSideBySide ? "w-fit max-w-3xl" : "w-full max-w-2xl"
        }`}
      >
        {isSideBySide ? (
          <div className="flex flex-col sm:flex-row gap-6">
            {frame}
            <div className="flex flex-col w-64 sm:w-56 sm:justify-center">
              <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a] mb-1">
                Ajustar posición
              </h2>
              <p className="text-xs text-text-secondary mb-4">{description}</p>
              {zoomControl}
              {actions}
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a] mb-1">
              Ajustar posición
            </h2>
            <p className="text-xs text-text-secondary mb-4">{description}</p>
            {frame}
            {zoomControl}
            {actions}
          </>
        )}
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
    sitioConfig?.hero_url ? { previewUrl: sitioConfig.hero_url } : null
  );
  const [desktopFocal, setDesktopFocal] = useState<Focal>({
    x: sitioConfig?.hero_focal_x ?? 50,
    y: sitioConfig?.hero_focal_y ?? 50,
  });
  const [mobileFocal, setMobileFocal] = useState<Focal>({
    x: sitioConfig?.hero_mobile_focal_x ?? 50,
    y: sitioConfig?.hero_mobile_focal_y ?? 50,
  });
  const [desktopZoom, setDesktopZoom] = useState(sitioConfig?.hero_zoom ?? 1);
  const [mobileZoom, setMobileZoom] = useState(
    sitioConfig?.hero_mobile_zoom ?? 1
  );
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editingView, setEditingView] = useState<"desktop" | "mobile" | null>(
    null
  );
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
        file,
      };
    });
    setDesktopFocal({ x: 50, y: 50 });
    setMobileFocal({ x: 50, y: 50 });
    setDesktopZoom(1);
    setMobileZoom(1);
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

  function handleSaveFocalPoint(focalX: number, focalY: number, zoom: number) {
    if (editingView === "desktop") {
      setDesktopFocal({ x: focalX, y: focalY });
      setDesktopZoom(zoom);
    } else if (editingView === "mobile") {
      setMobileFocal({ x: focalX, y: focalY });
      setMobileZoom(zoom);
    }
    setEditingView(null);
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
          hero_focal_x: desktopFocal.x,
          hero_focal_y: desktopFocal.y,
          hero_mobile_focal_x: mobileFocal.x,
          hero_mobile_focal_y: mobileFocal.y,
          hero_zoom: desktopZoom,
          hero_mobile_zoom: mobileZoom,
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
    <div className="max-w-4xl">
      <h1 className="font-helvetica font-bold text-2xl text-[#1a1a1a] mb-1">
        Portada
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        Imagen principal en la home pública.
      </p>

      <div className="flex flex-col gap-8">
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

          <div className="flex items-center justify-between gap-4 mt-3">
            <div>
              {hero && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-[#1a1a1a] font-medium border border-[#e0e0e0] rounded-full px-5 py-2 hover:bg-bg-alt transition-colors duration-200 cursor-pointer"
                >
                  Reemplazar imagen
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hero}
              className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-8 py-3 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Vista Web</label>
            <div className="relative aspect-video max-w-sm bg-bg-alt rounded-sm overflow-hidden">
              {hero && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hero.previewUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectPosition: `${desktopFocal.x}% ${desktopFocal.y}%`,
                      transform: `scale(${desktopZoom})`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingView("desktop")}
                    className="group absolute inset-0 flex items-center justify-center cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200" />
                    <span className="relative text-sm font-medium text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Ajustar
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Vista Móvil</label>
            <div className="relative aspect-[9/19.5] max-w-[130px] bg-bg-alt rounded-sm overflow-hidden">
              {hero && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hero.previewUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectPosition: `${mobileFocal.x}% ${mobileFocal.y}%`,
                      transform: `scale(${mobileZoom})`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingView("mobile")}
                    className="group absolute inset-0 flex items-center justify-center cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200" />
                    <span className="relative text-xs font-medium text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Ajustar
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingView && hero && (
        <HeroFocalPointModal
          image={hero}
          focal={editingView === "desktop" ? desktopFocal : mobileFocal}
          zoom={editingView === "desktop" ? desktopZoom : mobileZoom}
          aspectClassName={editingView === "desktop" ? "aspect-video" : "aspect-[9/19.5]"}
          layout={editingView === "mobile" ? "sideBySide" : "stacked"}
          description={
            editingView === "desktop"
              ? "Arrastrá la imagen dentro del marco para elegir qué parte se ve en la vista de escritorio (16:9)."
              : "Arrastrá la imagen dentro del marco para elegir qué parte se ve en la vista móvil."
          }
          onSave={handleSaveFocalPoint}
          onCancel={() => setEditingView(null)}
        />
      )}
    </div>
  );
}
