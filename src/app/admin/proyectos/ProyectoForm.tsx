"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import type { Categoria, Proyecto, ProyectoImagen } from "@/types/database";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClass =
  "w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200";

const labelClass =
  "block text-xs uppercase tracking-widest text-text-secondary mb-1.5";

type ProyectoConImagenes = Proyecto & { imagenes: ProyectoImagen[] };

type PendingImage = {
  id: string;
  previewUrl: string;
  focalX: number;
  focalY: number;
  // Presente solo para imágenes nuevas (todavía no subidas a storage).
  // Su ausencia indica que la imagen ya existe en proyecto_imagenes.
  file?: File;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200 cursor-pointer ${
        checked ? "bg-[#1a1a1a]" : "bg-[#e0e0e0]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function DragHandleIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <circle cx="7" cy="4" r="1.3" />
      <circle cx="13" cy="4" r="1.3" />
      <circle cx="7" cy="10" r="1.3" />
      <circle cx="13" cy="10" r="1.3" />
      <circle cx="7" cy="16" r="1.3" />
      <circle cx="13" cy="16" r="1.3" />
    </svg>
  );
}

function ImageCard({
  image,
  isCover,
  onEdit,
  onRemove,
}: {
  image: PendingImage;
  isCover: boolean;
  onEdit: (image: PendingImage) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-sm overflow-hidden ${
        isCover ? "border-2 border-[#1a1a1a]" : "border border-[#e0e0e0]"
      }`}
    >
      <div className="relative aspect-[4/3] bg-bg-alt">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.previewUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }}
        />
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-white/90 rounded-full text-text-secondary hover:text-[#1a1a1a] cursor-grab active:cursor-grabbing shadow-sm"
          style={{ touchAction: "none" }}
          aria-label="Reordenar imagen"
        >
          <DragHandleIcon />
        </button>
        {isCover && (
          <span className="absolute top-2 right-2 bg-[#1a1a1a] text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-full">
            Portada
          </span>
        )}
      </div>
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => onEdit(image)}
          className="w-1/2 py-2 border border-[#e0e0e0] text-xs text-[#1a1a1a] font-medium hover:bg-bg-alt transition-colors duration-200 cursor-pointer"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="w-1/2 py-2 border border-l-0 border-[#e0e0e0] text-xs text-red-600 hover:text-red-800 hover:bg-bg-alt transition-colors duration-200 cursor-pointer"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

type Size = { width: number; height: number };

function FocalPointModal({
  image,
  onSave,
  onCancel,
}: {
  image: PendingImage;
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
  // null mientras el usuario no arrastró todavía: el offset se deriva del
  // focal_x/focal_y ya guardado. Una vez que arrastra, esto pasa a mandar.
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  // Mide el marco de recorte (su tamaño real en píxeles, que puede variar
  // según el ancho disponible del modal).
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

  // Escala "cover": la imagen llena el marco por el eje más chico, sin
  // distorsión. El eje que no coincide exactamente con el marco es el que
  // queda con espacio de sobra ("excess") para poder arrastrar.
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

  // Offset derivado del focal_x/focal_y ya guardado (o 50/50 si es nueva),
  // hasta que el usuario arrastre y dragOffset tome el control.
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

  // Traducción inversa de la posición de arrastre a focal_x/focal_y (0-100),
  // el mismo formato que ya consumen object-position en la landing pública.
  const focalX = excessX > 0 ? clamp((-offset.x / excessX) * 100, 0, 100) : 50;
  const focalY = excessY > 0 ? clamp((-offset.y / excessY) * 100, 0, 100) : 50;
  const canDrag = excessX > 0 || excessY > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-heading font-bold text-lg text-[#1a1a1a] mb-1">
          Ajustar recorte
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Arrastrá la imagen dentro del marco para elegir qué parte se ve
          siempre en los recortes.
        </p>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative w-full max-w-md mx-auto aspect-[4/3] overflow-hidden bg-bg-alt rounded-sm select-none ${
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

export default function ProyectoForm({
  proyecto,
  categorias,
}: {
  proyecto?: ProyectoConImagenes;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const isEditMode = Boolean(proyecto);

  const [categoriaId, setCategoriaId] = useState(
    proyecto?.categoria_id ?? ""
  );
  const [nombre, setNombre] = useState(proyecto?.nombre ?? "");
  const [subtitulo, setSubtitulo] = useState(proyecto?.subtitulo ?? "");
  const [descripcion, setDescripcion] = useState(proyecto?.descripcion ?? "");
  const [activo, setActivo] = useState(proyecto?.activo ?? true);
  const [images, setImages] = useState<PendingImage[]>(() =>
    (proyecto?.imagenes ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((img) => ({
        id: img.id,
        previewUrl: img.url,
        focalX: img.focal_x,
        focalY: img.focal_y,
      }))
  );
  const [editingImage, setEditingImage] = useState<PendingImage | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image.file) URL.revokeObjectURL(image.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const valid: File[] = [];
    let hasInvalid = false;

    for (const file of files) {
      if (ALLOWED_TYPES.includes(file.type)) {
        valid.push(file);
      } else {
        hasInvalid = true;
      }
    }

    if (hasInvalid) {
      toast.error(
        "Formato no soportado. Convertí la imagen a JPG o PNG antes de subir."
      );
    }

    if (valid.length === 0) return;

    const newItems: PendingImage[] = valid.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      focalX: 50,
      focalY: 50,
    }));
    setImages((prev) => [...prev, ...newItems]);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      addFiles(e.target.files);
    }
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
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleRemove(id: string) {
    setImages((prev) => {
      const removed = prev.find((image) => image.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
  }

  function handleSaveFocalPoint(focalX: number, focalY: number) {
    if (!editingImage) return;
    setImages((prev) =>
      prev.map((image) =>
        image.id === editingImage.id ? { ...image, focalX, focalY } : image
      )
    );
    setEditingImage(null);
  }

  function handleImagesDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setImages((prev) => {
      const oldIndex = prev.findIndex((img) => img.id === active.id);
      const newIndex = prev.findIndex((img) => img.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleUpdateExisting(existing: ProyectoConImagenes) {
    setSaving(true);
    const supabase = createClient();
    const projectId = existing.id;

    // Snapshot de cómo estaban las imágenes existentes al cargar el form,
    // para poder diffear contra el estado actual y evitar updates innecesarios.
    const initialImages = existing.imagenes.map((img) => ({
      id: img.id,
      orden: img.orden,
      esPortada: img.es_portada,
      focalX: img.focal_x,
      focalY: img.focal_y,
      path: img.path,
    }));

    const errors: string[] = [];

    try {
      const { error: updateError } = await supabase
        .from("proyectos")
        .update({
          categoria_id: categoriaId,
          nombre: nombre.trim(),
          subtitulo: subtitulo.trim(),
          descripcion: descripcion.trim(),
          activo,
        })
        .eq("id", projectId);

      if (updateError) throw updateError;

      // 1. Borrar imágenes que el usuario sacó del form (storage + fila)
      const currentIds = new Set(images.map((img) => img.id));
      const removedImages = initialImages.filter(
        (img) => !currentIds.has(img.id)
      );

      if (removedImages.length > 0) {
        const pathsToRemove = removedImages.map((img) => img.path);
        const { error: storageError } = await supabase.storage
          .from("proyectos")
          .remove(pathsToRemove);
        if (storageError) {
          console.error(storageError);
          errors.push(
            "No se pudieron borrar del almacenamiento todas las imágenes eliminadas."
          );
        }

        const { error: deleteRowsError } = await supabase
          .from("proyecto_imagenes")
          .delete()
          .in(
            "id",
            removedImages.map((img) => img.id)
          );
        if (deleteRowsError) {
          console.error(deleteRowsError);
          errors.push(
            "No se pudieron borrar todas las filas de imágenes eliminadas."
          );
        }
      }

      // 2. Subir imágenes nuevas, y actualizar orden/portada/focal point
      //    de las existentes solo si algo cambió respecto a como estaban.
      for (let index = 0; index < images.length; index++) {
        const image = images[index];
        const esPortada = index === 0;

        if (image.file) {
          try {
            const extension = image.file.name.split(".").pop() || "jpg";
            const path = `${projectId}/${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase.storage
              .from("proyectos")
              .upload(path, image.file);
            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage.from("proyectos").getPublicUrl(path);

            const { error: insertError } = await supabase
              .from("proyecto_imagenes")
              .insert({
                proyecto_id: projectId,
                url: publicUrl,
                path,
                orden: index,
                es_portada: esPortada,
                focal_x: image.focalX,
                focal_y: image.focalY,
              });
            if (insertError) throw insertError;
          } catch (imageError) {
            console.error(imageError);
            errors.push("No se pudo subir una de las imágenes nuevas.");
          }
        } else {
          const original = initialImages.find((img) => img.id === image.id);
          const changed =
            !original ||
            original.orden !== index ||
            original.esPortada !== esPortada ||
            original.focalX !== image.focalX ||
            original.focalY !== image.focalY;

          if (changed) {
            const { error: updateImgError } = await supabase
              .from("proyecto_imagenes")
              .update({
                orden: index,
                es_portada: esPortada,
                focal_x: image.focalX,
                focal_y: image.focalY,
              })
              .eq("id", image.id);

            if (updateImgError) {
              console.error(updateImgError);
              errors.push(
                "No se pudieron guardar todos los cambios de orden o punto focal."
              );
            }
          }
        }
      }

      if (errors.length > 0) {
        toast.error(
          `El proyecto se actualizó, pero hubo problemas: ${Array.from(
            new Set(errors)
          ).join(" ")}`
        );
      } else {
        toast.success("Cambios guardados correctamente.");
      }

      router.push("/admin/proyectos");
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron guardar los cambios. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!categoriaId || !nombre.trim()) {
      toast.error("Categoría y nombre son obligatorios.");
      return;
    }

    if (isEditMode && proyecto) {
      await handleUpdateExisting(proyecto);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const id = crypto.randomUUID();

    try {
      const { data: maxOrdenRow } = await supabase
        .from("proyectos")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrden = (maxOrdenRow?.orden ?? -1) + 1;

      const { error: insertError } = await supabase.from("proyectos").insert({
        id,
        categoria_id: categoriaId,
        nombre: nombre.trim(),
        subtitulo: subtitulo.trim(),
        descripcion: descripcion.trim(),
        orden: nextOrden,
        activo,
      });

      if (insertError) throw insertError;

      const uploadedPaths: string[] = [];

      try {
        for (let index = 0; index < images.length; index++) {
          const image = images[index];
          // En modo creación todas las imágenes vienen de addFiles(), que
          // siempre setea `file`.
          const file = image.file!;
          const extension = file.name.split(".").pop() || "jpg";
          const path = `${id}/${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("proyectos")
            .upload(path, file);

          if (uploadError) throw uploadError;
          uploadedPaths.push(path);

          const {
            data: { publicUrl },
          } = supabase.storage.from("proyectos").getPublicUrl(path);

          const { error: imageInsertError } = await supabase
            .from("proyecto_imagenes")
            .insert({
              proyecto_id: id,
              url: publicUrl,
              path,
              orden: index,
              es_portada: index === 0,
              focal_x: image.focalX,
              focal_y: image.focalY,
            });

          if (imageInsertError) throw imageInsertError;
        }
      } catch (imagesError) {
        if (uploadedPaths.length > 0) {
          await supabase.storage.from("proyectos").remove(uploadedPaths);
        }
        await supabase.from("proyecto_imagenes").delete().eq("proyecto_id", id);
        await supabase.from("proyectos").delete().eq("id", id);
        throw imagesError;
      }

      toast.success("Proyecto creado correctamente.");
      router.push("/admin/proyectos");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo crear el proyecto. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const coverImage = images[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#1a1a1a] mb-6">
            {isEditMode ? "Editar proyecto" : "Nuevo proyecto"}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Categoría *</label>
              {categorias.length === 0 ? (
                <p className="text-sm text-text-secondary">
                  Todavía no hay categorías creadas.{" "}
                  <Link
                    href="/admin/categorias"
                    className="text-[#1a1a1a] underline hover:no-underline"
                  >
                    Creá una acá
                  </Link>{" "}
                  antes de continuar.
                </p>
              ) : (
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Bertoldi"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Subtítulo</label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ej. Vivienda"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                placeholder="Descripción del proyecto..."
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Estado</label>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={activo}
                  onChange={() => setActivo((prev) => !prev)}
                />
                <span className="text-sm text-[#1a1a1a]">
                  {activo
                    ? "Publicado (visible en la web)"
                    : "Oculto (no visible en la web)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Imágenes</label>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-sm px-6 py-10 text-center cursor-pointer transition-colors duration-150 ${
              isDraggingOver
                ? "border-2 border-solid border-[#1a1a1a] bg-[#1a1a1a]/15"
                : "border-2 border-dashed border-[#999999] hover:border-[#1a1a1a]"
            }`}
          >
            <span
              className={`text-sm transition-colors duration-150 ${
                isDraggingOver ? "text-[#1a1a1a] font-medium" : "text-[#1a1a1a]"
              }`}
            >
              {isDraggingOver
                ? "Soltá las imágenes acá"
                : "Arrastrá imágenes acá o hacé click para elegir"}
            </span>
            <span className="text-xs text-text-secondary">
              JPG, PNG o WEBP
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {images.length > 0 && (
            <div className="mt-4">
              <DndContext
                id="proyecto-form-images-dnd"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleImagesDragEnd}
              >
                <SortableContext
                  items={images.map((image) => image.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((image, index) => (
                      <ImageCard
                        key={image.id}
                        image={image}
                        isCover={index === 0}
                        onEdit={setEditingImage}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || categorias.length === 0}
            className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-8 py-3 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Guardando..."
              : isEditMode
              ? "Guardar cambios"
              : "Guardar proyecto"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/proyectos")}
            disabled={saving}
            className="text-sm text-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-3 hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className={labelClass}>Vista previa</p>
        <div className="relative w-full overflow-hidden aspect-[4/3] bg-[#f5f5f5] rounded-sm">
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage.previewUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: `${coverImage.focalX}% ${coverImage.focalY}%`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="block text-xs tracking-widest uppercase text-white/70 mb-1">
              {categorias.find((cat) => cat.id === categoriaId)?.nombre ||
                "Categoría"}
            </span>
            <span className="block font-helvetica font-semibold text-white text-base leading-snug uppercase tracking-wide">
              {nombre || "Nombre del proyecto"}
            </span>
            <span className="block text-[11px] text-white/60 uppercase tracking-widest mt-0.5">
              {subtitulo || "Subtítulo"}
            </span>
          </div>
        </div>
      </div>

      {editingImage && (
        <FocalPointModal
          image={editingImage}
          onSave={handleSaveFocalPoint}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </div>
  );
}
