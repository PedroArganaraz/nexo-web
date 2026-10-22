"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { comprimirImagen } from "@/lib/imagenes";
import { OBJETOS_BUCKET, OBJETOS_CARPETA } from "@/lib/objetos-constantes";
import {
  PRECIO_MAXIMO,
  calcularBeneficio,
  formatearImporte,
  formatearPorcentaje,
  formatearPrecio,
  montoDesdeDigitos,
  montoValido,
} from "@/lib/precio";
import type {
  AdminObjetoConImagenes,
  SubcategoriasPorCategoria,
} from "@/lib/admin/objetos";
import type { ObjetoCategoria, ObjetoImagen } from "@/types/database";
import FocalPointModal from "@/app/admin/FocalPointModal";
import DragHandleIcon from "../DragHandleIcon";
import ToggleActivo from "../ToggleActivo";
import MontoInput from "./MontoInput";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGENES = 8;

const inputClass =
  "w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200";

const labelClass =
  "block text-xs uppercase tracking-widest text-text-secondary mb-1.5";

const cardActionClass =
  "flex-1 min-h-10 border border-[#e0e0e0] text-xs font-medium transition-colors duration-200 cursor-pointer hover:bg-bg-alt";

type PendingImage = {
  id: string;
  previewUrl: string;
  focalX: number;
  focalY: number;
  file?: File;
};

type Supabase = ReturnType<typeof createClient>;

const MAX_PROVEEDOR = 80;

const ERROR_DATOS_INTERNOS =
  "El producto se guardó, pero no se pudieron guardar los datos internos. Revisalos y tocá «Reintentar datos internos».";

function limpiarTexto(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

function digitosDesdeMonto(monto: number | null | undefined): string {
  return monto != null ? String(Math.round(monto)) : "";
}

function ImageCard({
  image,
  isCover,
  onEdit,
  onSetCover,
  onRemove,
}: {
  image: PendingImage;
  isCover: boolean;
  onEdit: (image: PendingImage) => void;
  onSetCover: (id: string) => void;
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
      <div className="relative aspect-square bg-bg-alt">
        <Image
          src={image.previewUrl}
          alt=""
          fill
          sizes="(min-width: 640px) 240px, 50vw"
          className="object-cover"
          style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }}
        />
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute top-1 left-1 w-10 h-10 flex items-center justify-center"
          style={{ touchAction: "none" }}
          aria-label="Reordenar imagen"
        >
          <span className="w-7 h-7 flex items-center justify-center bg-white/90 rounded-full text-text-secondary hover:text-[#1a1a1a] cursor-grab active:cursor-grabbing shadow-sm">
            <DragHandleIcon />
          </span>
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
          className={`${cardActionClass} text-[#1a1a1a]`}
        >
          Editar
        </button>
        {!isCover && (
          <button
            type="button"
            onClick={() => onSetCover(image.id)}
            className={`${cardActionClass} border-l-0 text-[#1a1a1a]`}
          >
            Portada
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className={`${cardActionClass} border-l-0 text-red-600 hover:text-red-800`}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

async function siguienteOrden(
  supabase: Supabase,
  categoriaId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from("objetos")
    .select("orden")
    .eq("categoria_id", categoriaId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data?.orden ?? -1) + 1;
}

export default function ObjetoForm({
  objeto,
  categorias,
  subcategorias,
  initialCategoriaId,
}: {
  objeto?: AdminObjetoConImagenes;
  categorias: ObjetoCategoria[];
  subcategorias: SubcategoriasPorCategoria;
  initialCategoriaId?: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const blobUrlsRef = useRef(new Set<string>());
  const isEditMode = Boolean(objeto);

  const [categoriaId, setCategoriaId] = useState(
    objeto?.categoria_id ?? initialCategoriaId ?? ""
  );
  const [subcategoriaId, setSubcategoriaId] = useState(() =>
    objeto?.subcategoria_id &&
    (subcategorias[objeto.categoria_id] ?? []).some(
      (sub) => sub.id === objeto.subcategoria_id
    )
      ? objeto.subcategoria_id
      : ""
  );
  const [nombre, setNombre] = useState(objeto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(objeto?.descripcion ?? "");
  const [activo, setActivo] = useState(objeto?.activo ?? true);
  const [precioDigitos, setPrecioDigitos] = useState(
    digitosDesdeMonto(objeto?.precio)
  );
  const [costoDigitos, setCostoDigitos] = useState(
    digitosDesdeMonto(objeto?.costo)
  );
  const [proveedor, setProveedor] = useState(objeto?.proveedor ?? "");
  const [reintentoInternosId, setReintentoInternosId] = useState<
    string | null
  >(null);
  const [images, setImages] = useState<PendingImage[]>(() =>
    (objeto?.imagenes ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((img) => ({
        id: img.id,
        previewUrl: img.url,
        focalX: img.focal_x,
        focalY: img.focal_y,
      }))
  );
  const [coverId, setCoverId] = useState<string | null>(() => {
    const sorted = (objeto?.imagenes ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden);
    return (sorted.find((img) => img.es_portada) ?? sorted[0])?.id ?? null;
  });
  const [editingImage, setEditingImage] = useState<PendingImage | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const subcategoriasDeCategoria = categoriaId
    ? subcategorias[categoriaId] ?? []
    : [];
  const listHref = `/admin/objects/productos${
    categoriaId ? `?categoria=${categoriaId}` : ""
  }`;
  const portadaId = coverId ?? images[0]?.id ?? null;

  useEffect(() => {
    const blobUrls = blobUrlsRef.current;
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.clear();
    };
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const valid = files.filter((file) => ALLOWED_TYPES.includes(file.type));

    if (valid.length < files.length) {
      toast.error(
        "Formato no soportado. Convertí la imagen a JPG o PNG antes de subir."
      );
    }

    if (valid.length === 0) return;

    const disponibles = MAX_IMAGENES - images.length;
    if (disponibles <= 0) {
      toast.error(
        `Máximo ${MAX_IMAGENES} imágenes por producto. Eliminá alguna para agregar otra.`
      );
      return;
    }

    if (valid.length > disponibles) {
      toast.error(
        `Máximo ${MAX_IMAGENES} imágenes por producto. Se agregaron solo ${disponibles}.`
      );
    }

    const newItems: PendingImage[] = valid.slice(0, disponibles).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      focalX: 50,
      focalY: 50,
    }));

    newItems.forEach((item) => blobUrlsRef.current.add(item.previewUrl));
    setImages((prev) => [...prev, ...newItems]);
    setCoverId((prev) => prev ?? newItems[0].id);
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
    const removed = images.find((image) => image.id === id);
    if (removed?.file) {
      URL.revokeObjectURL(removed.previewUrl);
      blobUrlsRef.current.delete(removed.previewUrl);
    }
    const restantes = images.filter((image) => image.id !== id);
    setImages(restantes);
    if (portadaId === id) {
      setCoverId(restantes[0]?.id ?? null);
    }
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

  async function subirImagenesNuevas(
    supabase: Supabase,
    objetoId: string
  ): Promise<Map<string, { url: string; path: string }> | null> {
    const subidas = new Map<string, { url: string; path: string }>();

    try {
      for (const image of images) {
        if (!image.file) continue;

        const archivo = await comprimirImagen(image.file);
        const extension = archivo.name.split(".").pop() || "jpg";
        const path = `${OBJETOS_CARPETA}${objetoId}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(OBJETOS_BUCKET)
          .upload(path, archivo);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(OBJETOS_BUCKET).getPublicUrl(path);
        subidas.set(image.id, { url: publicUrl, path });
      }
    } catch (err) {
      console.error(err);
      await descartarSubidas(supabase, subidas);
      toast.error(
        "No se pudieron subir las imágenes. No se guardó ningún cambio. Intentá de nuevo."
      );
      return null;
    }

    return subidas;
  }

  async function descartarSubidas(
    supabase: Supabase,
    subidas: Map<string, { url: string; path: string }>
  ) {
    const paths = Array.from(subidas.values()).map((subida) => subida.path);
    if (paths.length > 0) {
      await supabase.storage.from(OBJETOS_BUCKET).remove(paths);
    }
  }

  function filasNuevas(
    objetoId: string,
    subidas: Map<string, { url: string; path: string }>
  ) {
    return images.flatMap((image, index) => {
      const subida = subidas.get(image.id);
      if (!subida) return [];
      return [
        {
          objeto_id: objetoId,
          url: subida.url,
          path: subida.path,
          orden: index,
          es_portada: image.id === portadaId,
          focal_x: image.focalX,
          focal_y: image.focalY,
        },
      ];
    });
  }

  async function guardarDatosInternos(
    supabase: Supabase,
    objetoId: string,
    puedeHaberFila: boolean
  ): Promise<boolean> {
    const costo = montoDesdeDigitos(costoDigitos);
    const proveedorLimpio = limpiarTexto(proveedor) || null;

    if (costo === null && proveedorLimpio === null) {
      if (!puedeHaberFila) return true;
      const { error } = await supabase
        .from("objeto_datos_internos")
        .delete()
        .eq("objeto_id", objetoId);
      if (error) console.error(error);
      return !error;
    }

    const { error } = await supabase
      .from("objeto_datos_internos")
      .upsert(
        { objeto_id: objetoId, costo, proveedor: proveedorLimpio },
        { onConflict: "objeto_id" }
      );
    if (error) console.error(error);
    return !error;
  }

  async function handleCreate() {
    const supabase = createClient();
    const id = crypto.randomUUID();

    const orden = await siguienteOrden(supabase, categoriaId);
    if (orden === null) {
      toast.error("No se pudo crear el producto. Intentá de nuevo.");
      return;
    }

    const subidas = await subirImagenesNuevas(supabase, id);
    if (!subidas) return;

    const { error: insertError } = await supabase.from("objetos").insert({
      id,
      categoria_id: categoriaId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: montoDesdeDigitos(precioDigitos),
      subcategoria_id: subcategoriaId || null,
      activo,
      orden,
    });

    if (insertError) {
      console.error(insertError);
      await descartarSubidas(supabase, subidas);
      toast.error("No se pudo crear el producto. Intentá de nuevo.");
      return;
    }

    const filas = filasNuevas(id, subidas);
    if (filas.length > 0) {
      const { error: imagenesError } = await supabase
        .from("objeto_imagenes")
        .insert(filas);

      if (imagenesError) {
        console.error(imagenesError);
        await supabase.from("objetos").delete().eq("id", id);
        await descartarSubidas(supabase, subidas);
        toast.error("No se pudo crear el producto. Intentá de nuevo.");
        return;
      }
    }

    if (!(await guardarDatosInternos(supabase, id, false))) {
      setReintentoInternosId(id);
      toast.error(ERROR_DATOS_INTERNOS);
      return;
    }

    toast.success("Producto creado.");
    router.push(listHref);
  }

  async function handleUpdate(existing: AdminObjetoConImagenes) {
    const supabase = createClient();

    const subidas = await subirImagenesNuevas(supabase, existing.id);
    if (!subidas) return;

    let orden = existing.orden;
    if (categoriaId !== existing.categoria_id) {
      const nuevoOrden = await siguienteOrden(supabase, categoriaId);
      if (nuevoOrden === null) {
        await descartarSubidas(supabase, subidas);
        toast.error("No se pudieron guardar los cambios. Intentá de nuevo.");
        return;
      }
      orden = nuevoOrden;
    }

    const { error: updateError } = await supabase
      .from("objetos")
      .update({
        categoria_id: categoriaId,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: montoDesdeDigitos(precioDigitos),
        subcategoria_id: subcategoriaId || null,
        activo,
        orden,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error(updateError);
      await descartarSubidas(supabase, subidas);
      toast.error("No se pudieron guardar los cambios. Intentá de nuevo.");
      return;
    }

    const errors: string[] = [];

    const currentIds = new Set(images.map((img) => img.id));
    const removed = existing.imagenes.filter((img) => !currentIds.has(img.id));

    if (removed.length > 0) {
      const { error: deleteRowsError } = await supabase
        .from("objeto_imagenes")
        .delete()
        .in(
          "id",
          removed.map((img) => img.id)
        );

      if (deleteRowsError) {
        console.error(deleteRowsError);
        errors.push("No se pudieron eliminar algunas imágenes.");
      } else {
        const { error: storageError } = await supabase.storage
          .from(OBJETOS_BUCKET)
          .remove(removed.map((img) => img.path));
        if (storageError) {
          console.error(storageError);
          errors.push(
            "No se pudieron borrar del almacenamiento todas las imágenes eliminadas."
          );
        }
      }
    }

    const originales = new Map<string, ObjetoImagen>(
      existing.imagenes.map((img) => [img.id, img])
    );
    const cambios = images
      .map((image, index) => ({ image, index, original: originales.get(image.id) }))
      .filter(
        ({ image, index, original }) =>
          original &&
          (original.orden !== index ||
            original.es_portada !== (image.id === portadaId) ||
            original.focal_x !== image.focalX ||
            original.focal_y !== image.focalY)
      )
      .sort(
        (a, b) =>
          Number(a.image.id === portadaId) - Number(b.image.id === portadaId)
      );

    for (const { image, index } of cambios) {
      const { error: updateImgError } = await supabase
        .from("objeto_imagenes")
        .update({
          orden: index,
          es_portada: image.id === portadaId,
          focal_x: image.focalX,
          focal_y: image.focalY,
        })
        .eq("id", image.id);

      if (updateImgError) {
        console.error(updateImgError);
        errors.push(
          "No se pudieron guardar todos los cambios de orden, portada o punto focal."
        );
      }
    }

    const filas = filasNuevas(existing.id, subidas);
    if (filas.length > 0) {
      const { error: insertImgError } = await supabase
        .from("objeto_imagenes")
        .insert(filas);

      if (insertImgError) {
        console.error(insertImgError);
        await descartarSubidas(supabase, subidas);
        errors.push("No se pudieron guardar las imágenes nuevas.");
      }
    }

    const internosGuardados = await guardarDatosInternos(
      supabase,
      existing.id,
      existing.costo !== null || existing.proveedor !== null
    );

    if (!internosGuardados) {
      setReintentoInternosId(existing.id);
      toast.error(
        errors.length > 0
          ? `${ERROR_DATOS_INTERNOS} Además: ${Array.from(new Set(errors)).join(" ")}`
          : ERROR_DATOS_INTERNOS
      );
      return;
    }

    if (errors.length > 0) {
      toast.error(
        `El producto se actualizó, pero hubo problemas: ${Array.from(
          new Set(errors)
        ).join(" ")}`
      );
    } else {
      toast.success("Cambios guardados.");
    }

    router.push(listHref);
  }

  async function handleReintentarInternos(objetoId: string) {
    setSaving(true);
    try {
      if (await guardarDatosInternos(createClient(), objetoId, true)) {
        toast.success("Datos internos guardados.");
        router.push(listHref);
      } else {
        toast.error(
          "No se pudieron guardar los datos internos. Intentá de nuevo."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function validarDatosInternos(): boolean {
    if (!montoValido(montoDesdeDigitos(costoDigitos))) {
      toast.error(
        `El costo tiene que ser un número entero mayor a $0 y menor a ${formatearPrecio(PRECIO_MAXIMO)}. Dejalo vacío si no querés cargarlo.`
      );
      return false;
    }

    if (limpiarTexto(proveedor).length > MAX_PROVEEDOR) {
      toast.error(`El proveedor puede tener hasta ${MAX_PROVEEDOR} caracteres.`);
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (reintentoInternosId) {
      if (validarDatosInternos()) {
        await handleReintentarInternos(reintentoInternosId);
      }
      return;
    }

    if (!categoriaId || !nombre.trim()) {
      toast.error("Categoría y nombre son obligatorios.");
      return;
    }

    if (
      subcategoriaId &&
      !subcategoriasDeCategoria.some((sub) => sub.id === subcategoriaId)
    ) {
      toast.error(
        "La subcategoría elegida no pertenece a la categoría. Elegí otra o dejala sin subcategoría."
      );
      return;
    }

    if (!montoValido(montoDesdeDigitos(precioDigitos))) {
      toast.error(
        `El precio tiene que ser un número entero mayor a $0 y menor a ${formatearPrecio(PRECIO_MAXIMO)}. Dejalo vacío si no querés mostrar precio.`
      );
      return;
    }

    if (!validarDatosInternos()) return;

    if (activo && images.length === 0) {
      toast.error(
        "Un producto activo necesita al menos una imagen. Agregá una o desactivalo para guardarlo."
      );
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && objeto) {
        await handleUpdate(objeto);
      } else {
        await handleCreate();
      }
    } finally {
      setSaving(false);
    }
  }

  const sinImagenesActivo = activo && images.length === 0;
  const precio = montoDesdeDigitos(precioDigitos);
  const costo = montoDesdeDigitos(costoDigitos);
  const precioFueraDeRango = !montoValido(precio);
  const costoFueraDeRango = !montoValido(costo);
  const resumen =
    precioFueraDeRango || costoFueraDeRango
      ? null
      : calcularBeneficio(precio, costo);

  return (
    <div className="max-w-3xl flex flex-col gap-8">
      <div>
        <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a] mb-4">
          {isEditMode ? "Editar producto" : "Nuevo producto"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Categoría *</label>
            {categorias.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Todavía no hay categorías.{" "}
                <Link
                  href="/admin/objects/categorias"
                  className="text-[#1a1a1a] underline hover:no-underline"
                >
                  Creá una acá
                </Link>{" "}
                antes de continuar.
              </p>
            ) : (
              <select
                value={categoriaId}
                onChange={(e) => {
                  setCategoriaId(e.target.value);
                  setSubcategoriaId("");
                }}
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
          {subcategoriasDeCategoria.length > 0 && (
            <div>
              <label htmlFor="objeto-subcategoria" className={labelClass}>
                Subcategoría (opcional)
              </label>
              <select
                id="objeto-subcategoria"
                value={subcategoriaId}
                onChange={(e) => setSubcategoriaId(e.target.value)}
                className={inputClass}
              >
                <option value="">Sin subcategoría</option>
                {subcategoriasDeCategoria.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Lámpara"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="objeto-precio" className={labelClass}>
              Precio (opcional)
            </label>
            <MontoInput
              id="objeto-precio"
              digitos={precioDigitos}
              onChange={setPrecioDigitos}
              placeholder="Ej. 150.000"
              className={inputClass}
            />
            {precioFueraDeRango ? (
              <p className="text-xs text-red-600 mt-1.5">
                Tiene que ser menor a {formatearPrecio(PRECIO_MAXIMO)}.
              </p>
            ) : (
              <p className="text-xs text-text-secondary mt-1.5">
                Si lo dejás vacío, no se muestra precio.
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={6}
              placeholder="Materiales, medidas, terminaciones..."
              className={`${inputClass} resize-y`}
            />
          </div>
          <div className="sm:col-span-2">
            <span className={labelClass}>Estado</span>
            <ToggleActivo
              checked={activo}
              onChange={() => setActivo((prev) => !prev)}
              disabled={saving}
            >
              <span className="text-sm text-[#1a1a1a] text-left">
                {activo
                  ? "Activo (visible en la web)"
                  : "Inactivo (no visible en la web)"}
              </span>
            </ToggleActivo>
            {sinImagenesActivo && (
              <p className="text-xs text-red-600 mt-1">
                Para guardarlo como activo necesita al menos una imagen.
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className={labelClass}>Imágenes</span>
          <span className="text-xs text-text-secondary">
            {images.length} de {MAX_IMAGENES}
          </span>
        </div>

        <p className="text-xs text-text-secondary mb-3">
          Recomendado: fotos horizontales o cuadradas, con el producto centrado
          y espacio alrededor. Las fotos muy verticales o muy alargadas se
          recortan.
        </p>

        {images.length < MAX_IMAGENES ? (
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
                : "Arrastrá imágenes acá o tocá para elegir"}
            </span>
            <span className="text-xs text-text-secondary">
              JPG, PNG o WEBP · hasta {MAX_IMAGENES} imágenes
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
        ) : (
          <p className="rounded-sm border border-[#e0e0e0] bg-white px-4 py-3 text-sm text-text-secondary">
            Llegaste al máximo de {MAX_IMAGENES} imágenes. Eliminá alguna para
            agregar otra.
          </p>
        )}

        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-text-secondary mb-3">
              Arrastrá para ordenar. La portada es la que se muestra en el
              listado.
            </p>
            <DndContext
              id="objeto-form-images-dnd"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleImagesDragEnd}
            >
              <SortableContext
                items={images.map((image) => image.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      isCover={image.id === portadaId}
                      onEdit={setEditingImage}
                      onSetCover={setCoverId}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <section
        aria-labelledby="datos-internos-titulo"
        className="border-t border-[#e0e0e0] pt-8"
      >
        <h3
          id="datos-internos-titulo"
          className="font-helvetica font-bold text-base text-[#1a1a1a]"
        >
          Datos internos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="objeto-costo" className={labelClass}>
              Costo (opcional)
            </label>
            <MontoInput
              id="objeto-costo"
              digitos={costoDigitos}
              onChange={setCostoDigitos}
              placeholder="Ej. 100.000"
              className={inputClass}
            />
            {costoFueraDeRango && (
              <p className="text-xs text-red-600 mt-1.5">
                Tiene que ser menor a {formatearPrecio(PRECIO_MAXIMO)}.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="objeto-proveedor" className={labelClass}>
              Proveedor (opcional)
            </label>
            <input
              id="objeto-proveedor"
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              maxLength={MAX_PROVEEDOR}
              autoComplete="off"
              placeholder="Ej. Taller de madera"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 rounded-sm border border-[#e0e0e0] bg-white px-4 py-3">
            <p
              aria-live="polite"
              className={`text-sm break-words ${
                resumen
                  ? resumen.beneficio < 0
                    ? "text-red-600 font-medium"
                    : "text-[#1a1a1a] font-medium"
                  : "text-text-secondary"
              }`}
            >
              {resumen
                ? `Beneficio: ${formatearImporte(resumen.beneficio)} · Margen: ${formatearPorcentaje(resumen.margen)}`
                : "Cargá precio y costo para ver el beneficio"}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              Margen = beneficio ÷ precio de venta
            </p>
          </div>
        </div>
      </section>

      {reintentoInternosId && (
        <p
          role="alert"
          className="rounded-sm border border-red-600 bg-white px-4 py-3 text-sm text-red-600"
        >
          El producto ya se guardó, pero faltan los datos internos. Revisá costo
          y proveedor y tocá «Reintentar datos internos». El resto de los
          cambios no se vuelve a guardar.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || categorias.length === 0}
          className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-8 py-3 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? "Guardando..."
            : reintentoInternosId
              ? "Reintentar datos internos"
              : isEditMode
                ? "Guardar cambios"
                : "Guardar producto"}
        </button>
        <button
          type="button"
          onClick={() => router.push(listHref)}
          disabled={saving}
          className="text-sm text-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-3 hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {editingImage && (
        <FocalPointModal
          image={editingImage}
          onSave={handleSaveFocalPoint}
          onCancel={() => setEditingImage(null)}
          aspecto="1/1"
          nota="El marco es el recorte cuadrado de la tarjeta. En la ficha del producto la foto se ve completa."
        />
      )}
    </div>
  );
}
