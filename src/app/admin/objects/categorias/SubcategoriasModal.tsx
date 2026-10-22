"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import type { ObjetoSubcategoria } from "@/types/database";
import DragHandleIcon from "../DragHandleIcon";

const MAX_NOMBRE = 40;

const inputClass =
  "w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200";

const smallButtonClass =
  "inline-flex min-h-10 items-center text-xs font-medium border border-[#e0e0e0] rounded-full px-3 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

function limpiarNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, " ");
}

function SubcategoriaRow({
  subcategoria,
  editando,
  nombreEditado,
  onNombreEditadoChange,
  onEditar,
  onGuardar,
  onCancelar,
  onEliminar,
  busy,
}: {
  subcategoria: ObjetoSubcategoria;
  editando: boolean;
  nombreEditado: string;
  onNombreEditadoChange: (value: string) => void;
  onEditar: () => void;
  onGuardar: () => void;
  onCancelar: () => void;
  onEliminar: () => void;
  busy: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subcategoria.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-2 border-b border-[#e0e0e0] last:border-b-0 bg-white"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="flex w-10 h-10 shrink-0 items-center justify-center text-text-secondary cursor-grab active:cursor-grabbing hover:text-[#1a1a1a] transition-colors"
        style={{ touchAction: "none" }}
        aria-label={`Reordenar ${subcategoria.nombre}`}
      >
        <DragHandleIcon />
      </button>

      {editando ? (
        <input
          type="text"
          value={nombreEditado}
          onChange={(e) => onNombreEditadoChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onGuardar();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onCancelar();
            }
          }}
          maxLength={MAX_NOMBRE}
          autoFocus
          aria-label="Nuevo nombre"
          className={`${inputClass} flex-1 min-w-[8rem]`}
        />
      ) : (
        <span className="flex-1 min-w-[8rem] text-sm text-[#1a1a1a] break-words">
          {subcategoria.nombre}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {editando ? (
          <>
            <button
              type="button"
              onClick={onGuardar}
              disabled={busy}
              className={`${smallButtonClass} bg-[#1a1a1a] border-[#1a1a1a] text-white hover:bg-accent`}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              disabled={busy}
              className={`${smallButtonClass} text-[#1a1a1a] hover:border-[#1a1a1a]`}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEditar}
              disabled={busy}
              className={`${smallButtonClass} text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a]`}
            >
              Renombrar
            </button>
            <button
              type="button"
              onClick={onEliminar}
              disabled={busy}
              className={`${smallButtonClass} text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600`}
            >
              Eliminar
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export default function SubcategoriasModal({
  categoria,
  initialSubcategorias,
  onClose,
}: {
  categoria: { id: string; nombre: string };
  initialSubcategorias: ObjetoSubcategoria[];
  onClose: (subcategorias: ObjetoSubcategoria[]) => void;
}) {
  const [subcategorias, setSubcategorias] = useState(() =>
    [...initialSubcategorias].sort((a, b) => a.orden - b.orden)
  );
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose(subcategorias);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose, subcategorias]);

  function validar(nombre: string, exceptoId?: string): string | null {
    if (!nombre) return "El nombre es obligatorio.";
    if (nombre.length > MAX_NOMBRE) {
      return `El nombre puede tener hasta ${MAX_NOMBRE} caracteres.`;
    }
    const clave = nombre.toLocaleLowerCase("es-AR");
    const repetida = subcategorias.some(
      (sub) =>
        sub.id !== exceptoId && sub.nombre.toLocaleLowerCase("es-AR") === clave
    );
    if (repetida) {
      return `Ya existe la subcategoría "${nombre}" en ${categoria.nombre}.`;
    }
    return null;
  }

  async function handleAgregar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nombre = limpiarNombre(nuevoNombre);
    const error = validar(nombre);
    if (error) {
      toast.error(error);
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const orden =
      subcategorias.reduce((max, sub) => Math.max(max, sub.orden), -1) + 1;

    const { data, error: insertError } = await supabase
      .from("objeto_subcategorias")
      .insert({ categoria_id: categoria.id, nombre, orden })
      .select()
      .single();

    setBusy(false);

    if (insertError || !data) {
      toast.error(
        insertError?.code === "23505"
          ? `Ya existe la subcategoría "${nombre}" en ${categoria.nombre}.`
          : "No se pudo crear la subcategoría."
      );
      return;
    }

    setSubcategorias((prev) => [...prev, data]);
    setNuevoNombre("");
    toast.success("Subcategoría creada.");
  }

  function handleEditar(subcategoria: ObjetoSubcategoria) {
    setEditandoId(subcategoria.id);
    setNombreEditado(subcategoria.nombre);
  }

  async function handleGuardarNombre(subcategoria: ObjetoSubcategoria) {
    const nombre = limpiarNombre(nombreEditado);
    if (nombre === subcategoria.nombre) {
      setEditandoId(null);
      return;
    }

    const error = validar(nombre, subcategoria.id);
    if (error) {
      toast.error(error);
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("objeto_subcategorias")
      .update({ nombre })
      .eq("id", subcategoria.id);
    setBusy(false);

    if (updateError) {
      toast.error(
        updateError.code === "23505"
          ? `Ya existe la subcategoría "${nombre}" en ${categoria.nombre}.`
          : "No se pudo renombrar la subcategoría."
      );
      return;
    }

    setSubcategorias((prev) =>
      prev.map((sub) => (sub.id === subcategoria.id ? { ...sub, nombre } : sub))
    );
    setEditandoId(null);
    toast.success("Subcategoría actualizada.");
  }

  async function handleEliminar(subcategoria: ObjetoSubcategoria) {
    setBusy(true);
    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("objetos")
      .select("id", { count: "exact", head: true })
      .eq("subcategoria_id", subcategoria.id);

    if (countError) {
      setBusy(false);
      toast.error("No se pudo verificar qué productos usan la subcategoría.");
      return;
    }

    const mensaje =
      count && count > 0
        ? `¿Eliminar la subcategoría "${subcategoria.nombre}"? ${count} producto${
            count === 1 ? "" : "s"
          } quedará${count === 1 ? "" : "n"} sin subcategoría.`
        : `¿Eliminar la subcategoría "${subcategoria.nombre}"?`;

    if (!window.confirm(mensaje)) {
      setBusy(false);
      return;
    }

    const { error } = await supabase
      .from("objeto_subcategorias")
      .delete()
      .eq("id", subcategoria.id);
    setBusy(false);

    if (error) {
      toast.error("No se pudo eliminar la subcategoría.");
      return;
    }

    setSubcategorias((prev) => prev.filter((sub) => sub.id !== subcategoria.id));
    if (editandoId === subcategoria.id) setEditandoId(null);
    toast.success("Subcategoría eliminada.");
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subcategorias.findIndex((sub) => sub.id === active.id);
    const newIndex = subcategorias.findIndex((sub) => sub.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = subcategorias;
    const reordered = arrayMove(subcategorias, oldIndex, newIndex).map(
      (sub, index) => ({ ...sub, orden: index })
    );
    setSubcategorias(reordered);

    const affected = reordered.filter((sub) => {
      const original = previous.find((p) => p.id === sub.id);
      return original?.orden !== sub.orden;
    });
    if (affected.length === 0) return;

    const supabase = createClient();
    const results = await Promise.all(
      affected.map((sub) =>
        supabase
          .from("objeto_subcategorias")
          .update({ orden: sub.orden })
          .eq("id", sub.id)
      )
    );

    if (results.some((result) => result.error)) {
      setSubcategorias(previous);
      toast.error("No se pudo guardar el nuevo orden.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Subcategorías de ${categoria.nombre}`}
        className="bg-white rounded-sm w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
      >
        <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a]">
          Subcategorías
        </h2>
        <p className="text-sm text-text-secondary mb-4 break-words">
          {categoria.nombre}
        </p>

        <form onSubmit={handleAgregar} className="flex gap-2">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            maxLength={MAX_NOMBRE}
            placeholder="Ej. Veladores"
            aria-label="Nombre de la nueva subcategoría"
            className={`${inputClass} flex-1 min-w-0`}
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 min-h-10 bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-5 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </form>
        <p className="text-xs text-text-secondary mt-2 mb-4">
          Los cambios se guardan al instante. Arrastrá para ordenar.
        </p>

        {subcategorias.length === 0 ? (
          <p className="text-sm text-text-secondary py-4">
            Todavía no hay subcategorías.
          </p>
        ) : (
          <DndContext
            id="subcategorias-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subcategorias.map((sub) => sub.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="border border-[#e0e0e0] rounded-sm">
                {subcategorias.map((subcategoria) => (
                  <SubcategoriaRow
                    key={subcategoria.id}
                    subcategoria={subcategoria}
                    editando={editandoId === subcategoria.id}
                    nombreEditado={nombreEditado}
                    onNombreEditadoChange={setNombreEditado}
                    onEditar={() => handleEditar(subcategoria)}
                    onGuardar={() => handleGuardarNombre(subcategoria)}
                    onCancelar={() => setEditandoId(null)}
                    onEliminar={() => handleEliminar(subcategoria)}
                    busy={busy}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => onClose(subcategorias)}
            disabled={busy}
            className="min-h-10 text-sm text-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-2.5 hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
