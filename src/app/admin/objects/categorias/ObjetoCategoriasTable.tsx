"use client";

import { useState } from "react";
import Image from "next/image";
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
import { OBJETOS_BUCKET } from "@/lib/objetos-constantes";
import type { AdminObjetoCategoria } from "@/lib/admin/objetos";
import type { ObjetoCategoria } from "@/types/database";
import ToggleActivo from "../ToggleActivo";
import ObjetoCategoriaModal from "./ObjetoCategoriaModal";

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; categoria: AdminObjetoCategoria };

const GRID_MD =
  "md:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_7.5rem_7rem_11rem]";

const headerCellClass =
  "text-xs uppercase tracking-widest text-text-secondary font-normal";

const editButtonClass =
  "inline-flex min-h-10 items-center text-sm text-[#1a1a1a] font-medium border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-colors duration-200 md:min-h-0";

const deleteButtonClass =
  "inline-flex min-h-10 items-center text-sm text-red-600 border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed md:min-h-0";

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

function CategoriaRow({
  categoria,
  onEdit,
  onDelete,
  isDeleting,
  onToggleActivo,
  isToggling,
}: {
  categoria: AdminObjetoCategoria;
  onEdit: (categoria: AdminObjetoCategoria) => void;
  onDelete: (categoria: AdminObjetoCategoria) => void;
  isDeleting: boolean;
  onToggleActivo: (id: string, activo: boolean) => void;
  isToggling: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: categoria.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dimClass = categoria.activo ? "" : "opacity-40";
  const oculta = categoria.activo && categoria.objetosActivos === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[2.5rem_3.5rem_minmax(0,1fr)] ${GRID_MD} items-center gap-x-3 gap-y-2 px-3 py-3 border-b border-[#e0e0e0] last:border-b-0 bg-white`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="flex w-10 h-10 items-center justify-center text-text-secondary cursor-grab active:cursor-grabbing hover:text-[#1a1a1a] transition-colors"
        style={{ touchAction: "none" }}
        aria-label="Reordenar"
      >
        <DragHandleIcon />
      </button>

      <div
        className={`relative w-14 h-14 bg-bg-alt overflow-hidden rounded-sm transition-opacity duration-200 ${dimClass}`}
      >
        {categoria.imagen_url && (
          <Image
            src={categoria.imagen_url}
            alt={categoria.nombre}
            fill
            className="object-cover"
            sizes="56px"
            style={{
              objectPosition: `${categoria.focal_x}% ${categoria.focal_y}%`,
            }}
          />
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`text-sm text-[#1a1a1a] font-medium break-words transition-opacity duration-200 ${dimClass}`}
        >
          {categoria.nombre}
        </p>
        {oculta && (
          <span className="inline-block mt-1 text-xs text-text-secondary bg-bg-alt rounded-full px-2 py-0.5">
            Oculta: sin productos activos
          </span>
        )}
        <p
          className={`md:hidden mt-1 text-xs text-text-secondary transition-opacity duration-200 ${dimClass}`}
        >
          {categoria.objetosActivos} de {categoria.totalObjetos} productos
          activos
        </p>
      </div>

      <p
        className={`hidden md:block text-sm text-text-secondary transition-opacity duration-200 ${dimClass}`}
      >
        {categoria.objetosActivos} de {categoria.totalObjetos} activos
      </p>

      <div className="col-span-3 flex flex-wrap items-center justify-between gap-2 md:contents">
        <div className="flex md:justify-center">
          <ToggleActivo
            checked={categoria.activo}
            onChange={() => onToggleActivo(categoria.id, categoria.activo)}
            disabled={isToggling}
          >
            <span
              className={`text-xs ${
                categoria.activo
                  ? "text-text-secondary"
                  : "text-red-600 font-medium"
              }`}
            >
              {categoria.activo ? "Activa" : "Inactiva"}
            </span>
          </ToggleActivo>
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <button
            type="button"
            onClick={() => onEdit(categoria)}
            className={editButtonClass}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDelete(categoria)}
            disabled={isDeleting}
            className={deleteButtonClass}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ObjetoCategoriasTable({
  initialCategorias,
}: {
  initialCategorias: AdminObjetoCategoria[];
}) {
  const [categorias, setCategorias] = useState(initialCategorias);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const nextOrden =
    categorias.reduce((max, categoria) => Math.max(max, categoria.orden), -1) +
    1;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categorias.findIndex((c) => c.id === active.id);
    const newIndex = categorias.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousOrder = categorias;
    const newOrderIds = arrayMove(categorias, oldIndex, newIndex).map(
      (c) => c.id
    );
    const reordered = newOrderIds.map((id, index) => {
      const categoria = previousOrder.find((c) => c.id === id)!;
      return { ...categoria, orden: index };
    });

    setCategorias(reordered);

    const affected = reordered.filter((categoria, index) => {
      const original = previousOrder.find((c) => c.id === categoria.id);
      return original?.orden !== index;
    });

    if (affected.length === 0) return;

    const supabase = createClient();
    await Promise.all(
      affected.map((categoria) =>
        supabase
          .from("objeto_categorias")
          .update({ orden: categoria.orden })
          .eq("id", categoria.id)
      )
    );
  }

  async function handleDelete(categoria: AdminObjetoCategoria) {
    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("objetos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", categoria.id);

    if (countError) {
      window.alert("No se pudo verificar los productos de la categoría.");
      return;
    }

    if (count && count > 0) {
      window.alert(
        `Tiene ${count} producto${
          count === 1 ? "" : "s"
        }. Movelos o eliminalos antes de borrar la categoría.`
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(categoria.id);
    const { error } = await supabase
      .from("objeto_categorias")
      .delete()
      .eq("id", categoria.id);

    if (error) {
      setDeletingId(null);
      window.alert("No se pudo eliminar la categoría.");
      return;
    }

    if (categoria.imagen_path) {
      await supabase.storage
        .from(OBJETOS_BUCKET)
        .remove([categoria.imagen_path]);
    }

    setDeletingId(null);
    setCategorias((prev) => prev.filter((c) => c.id !== categoria.id));
  }

  async function handleToggleActivo(id: string, currentActivo: boolean) {
    const nextActivo = !currentActivo;
    const previous = categorias;

    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activo: nextActivo } : c))
    );
    setTogglingId(id);

    const supabase = createClient();
    const { error } = await supabase
      .from("objeto_categorias")
      .update({ activo: nextActivo })
      .eq("id", id);

    setTogglingId(null);

    if (error) {
      setCategorias(previous);
      window.alert("No se pudo actualizar el estado de la categoría.");
    }
  }

  function handleSaved(saved: ObjetoCategoria) {
    setCategorias((prev) => {
      const existing = prev.find((c) => c.id === saved.id);
      if (existing) {
        return prev.map((c) =>
          c.id === saved.id ? { ...existing, ...saved } : c
        );
      }
      return [...prev, { ...saved, totalObjetos: 0, objetosActivos: 0 }];
    });
    setModalState(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a]">
          Categorías
        </h2>
        <button
          type="button"
          onClick={() => setModalState({ mode: "create" })}
          className="min-h-10 bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer"
        >
          + Nueva categoría
        </button>
      </div>

      {categorias.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No hay categorías todavía.
        </p>
      ) : (
        <div className="bg-white border border-[#e0e0e0] rounded-sm">
          <div
            className={`hidden md:grid ${GRID_MD} items-center gap-x-3 px-3 py-3 border-b border-[#e0e0e0]`}
          >
            <span />
            <span />
            <span className={headerCellClass}>Nombre</span>
            <span className={headerCellClass}>Productos</span>
            <span className={`${headerCellClass} text-center`}>Estado</span>
            <span className={`${headerCellClass} text-center`}>Acciones</span>
          </div>
          <DndContext
            id="objeto-categorias-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categorias.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {categorias.map((categoria) => (
                <CategoriaRow
                  key={categoria.id}
                  categoria={categoria}
                  onEdit={(c) => setModalState({ mode: "edit", categoria: c })}
                  onDelete={handleDelete}
                  isDeleting={deletingId === categoria.id}
                  onToggleActivo={handleToggleActivo}
                  isToggling={togglingId === categoria.id}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {modalState && (
        <ObjetoCategoriaModal
          categoria={modalState.mode === "edit" ? modalState.categoria : null}
          nextOrden={nextOrden}
          onSaved={handleSaved}
          onCancel={() => setModalState(null)}
        />
      )}
    </div>
  );
}
