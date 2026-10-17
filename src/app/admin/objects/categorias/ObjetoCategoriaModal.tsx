"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagen } from "@/lib/imagenes";
import {
  OBJETOS_BUCKET,
  OBJETO_CATEGORIAS_CARPETA,
} from "@/lib/objetos-constantes";
import { slugify, slugUnico } from "@/lib/slug";
import type { ObjetoCategoria } from "@/types/database";
import FocalPointModal from "@/app/admin/FocalPointModal";
import ToggleActivo from "../ToggleActivo";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const inputClass =
  "w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200";

const labelClass =
  "block text-xs uppercase tracking-widest text-text-secondary mb-1.5";

const imageActionClass =
  "flex-1 min-h-10 border border-[#e0e0e0] text-xs font-medium transition-colors duration-200 cursor-pointer hover:bg-bg-alt disabled:opacity-50 disabled:cursor-not-allowed";

type ImagenState = {
  previewUrl: string;
  focalX: number;
  focalY: number;
  file?: File;
};

export default function ObjetoCategoriaModal({
  categoria,
  nextOrden,
  onSaved,
  onCancel,
}: {
  categoria: ObjetoCategoria | null;
  nextOrden: number;
  onSaved: (categoria: ObjetoCategoria) => void;
  onCancel: () => void;
}) {
  const isEditMode = Boolean(categoria);
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [activo, setActivo] = useState(categoria?.activo ?? true);
  const [imagen, setImagen] = useState<ImagenState | null>(
    categoria?.imagen_url
      ? {
          previewUrl: categoria.imagen_url,
          focalX: categoria.focal_x,
          focalY: categoria.focal_y,
        }
      : null
  );
  const [editingFocal, setEditingFocal] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  function replaceBlobUrl(url: string | null) {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = url;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Formato no soportado. Convertí la imagen a JPG o PNG antes de subir."
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    replaceBlobUrl(previewUrl);
    setImagen({ previewUrl, file, focalX: 50, focalY: 50 });
  }

  function handleRemoveImage() {
    replaceBlobUrl(null);
    setImagen(null);
  }

  function handleSaveFocalPoint(focalX: number, focalY: number) {
    setImagen((prev) => (prev ? { ...prev, focalX, focalY } : prev));
    setEditingFocal(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    let slug: string | null = null;
    if (!isEditMode) {
      const base = slugify(nombreLimpio) || "categoria";
      const { data: existentes, error: slugError } = await supabase
        .from("objeto_categorias")
        .select("slug")
        .like("slug", `${base}%`);

      if (slugError) {
        setSaving(false);
        toast.error("No se pudo crear la categoría.");
        return;
      }

      slug = slugUnico(
        base,
        (existentes ?? []).map((fila) => fila.slug)
      );
    }

    let subida: { url: string; path: string } | null = null;
    if (imagen?.file) {
      const archivo = await comprimirImagen(imagen.file);
      const extension = archivo.name.split(".").pop() || "jpg";
      const path = `${OBJETO_CATEGORIAS_CARPETA}${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(OBJETOS_BUCKET)
        .upload(path, archivo);

      if (uploadError) {
        setSaving(false);
        toast.error("No se pudo subir la imagen.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(OBJETOS_BUCKET).getPublicUrl(path);
      subida = { url: publicUrl, path };
    }

    const imagenCampos = subida
      ? { imagen_url: subida.url, imagen_path: subida.path }
      : imagen
        ? {}
        : { imagen_url: null, imagen_path: null };

    const campos = {
      nombre: nombreLimpio,
      activo,
      focal_x: imagen?.focalX ?? 50,
      focal_y: imagen?.focalY ?? 50,
      ...imagenCampos,
    };

    async function descartarSubida() {
      if (subida) {
        await supabase.storage.from(OBJETOS_BUCKET).remove([subida.path]);
      }
    }

    if (isEditMode && categoria) {
      const { data, error } = await supabase
        .from("objeto_categorias")
        .update(campos)
        .eq("id", categoria.id)
        .select()
        .single();

      if (error || !data) {
        await descartarSubida();
        setSaving(false);
        toast.error("No se pudo actualizar la categoría.");
        return;
      }

      if (categoria.imagen_path && categoria.imagen_path !== data.imagen_path) {
        await supabase.storage
          .from(OBJETOS_BUCKET)
          .remove([categoria.imagen_path]);
      }

      setSaving(false);
      toast.success("Categoría actualizada.");
      onSaved(data);
      return;
    }

    const { data, error } = await supabase
      .from("objeto_categorias")
      .insert({ ...campos, slug: slug!, orden: nextOrden })
      .select()
      .single();

    if (error || !data) {
      await descartarSubida();
      setSaving(false);
      toast.error("No se pudo crear la categoría.");
      return;
    }

    setSaving(false);
    toast.success("Categoría creada.");
    onSaved(data);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white rounded-sm w-full max-w-sm max-h-[90vh] overflow-y-auto p-6">
          <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a] mb-4">
            {isEditMode ? "Editar categoría" : "Nueva categoría"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Iluminación"
                autoFocus
                className={inputClass}
              />
              {categoria && (
                <p className="text-xs text-text-secondary mt-1.5 break-all">
                  /objects/{categoria.slug}
                </p>
              )}
            </div>

            <div>
              <span className={labelClass}>Imagen</span>
              {imagen ? (
                <div>
                  <div className="relative w-full aspect-[4/3] bg-bg-alt overflow-hidden rounded-sm">
                    <Image
                      src={imagen.previewUrl}
                      alt={nombre || "Imagen de la categoría"}
                      fill
                      className="object-cover"
                      sizes="384px"
                      style={{
                        objectPosition: `${imagen.focalX}% ${imagen.focalY}%`,
                      }}
                    />
                  </div>
                  <div className="flex mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingFocal(true)}
                      disabled={saving}
                      className={`${imageActionClass} text-[#1a1a1a]`}
                    >
                      Ajustar recorte
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className={`${imageActionClass} border-l-0 text-[#1a1a1a]`}
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={saving}
                      className={`${imageActionClass} border-l-0 text-red-600 hover:text-red-800`}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed border-[#999999] text-text-secondary hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm text-[#1a1a1a]">Elegir imagen</span>
                  <span className="text-xs">JPG, PNG o WebP</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <span className={labelClass}>Estado</span>
              <ToggleActivo
                checked={activo}
                onChange={() => setActivo((prev) => !prev)}
                disabled={saving}
              >
                <span className="text-sm text-[#1a1a1a] text-left">
                  {activo ? "Activa" : "Inactiva (no visible en la web)"}
                </span>
              </ToggleActivo>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="min-h-10 bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="min-h-10 text-sm text-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-2.5 hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {editingFocal && imagen && (
        <FocalPointModal
          image={imagen}
          onSave={handleSaveFocalPoint}
          onCancel={() => setEditingFocal(false)}
        />
      )}
    </>
  );
}
