"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Categoria } from "@/types/database";

const inputClass =
  "w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200";

const labelClass =
  "block text-xs uppercase tracking-widest text-text-secondary mb-1.5";

export default function CategoriaModal({
  categoria,
  onSaved,
  onCancel,
}: {
  categoria: Categoria | null;
  onSaved: (categoria: Categoria) => void;
  onCancel: () => void;
}) {
  const isEditMode = Boolean(categoria);
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (isEditMode && categoria) {
      const { data, error } = await supabase
        .from("categorias")
        .update({ nombre: nombre.trim() })
        .eq("id", categoria.id)
        .select()
        .single();

      setSaving(false);

      if (error || !data) {
        toast.error("No se pudo actualizar la categoría.");
        return;
      }

      toast.success("Categoría actualizada.");
      onSaved(data);
      return;
    }

    const { data, error } = await supabase
      .from("categorias")
      .insert({ nombre: nombre.trim() })
      .select()
      .single();

    setSaving(false);

    if (error || !data) {
      toast.error("No se pudo crear la categoría.");
      return;
    }

    toast.success("Categoría creada.");
    onSaved(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-sm w-full max-w-sm p-6">
        <h2 className="font-heading font-bold text-lg text-[#1a1a1a] mb-4">
          {isEditMode ? "Editar categoría" : "Nueva categoría"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Arquitectura residencial"
              autoFocus
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-4 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="text-sm text-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-2.5 hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
