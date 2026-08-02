"use client";

import { useState } from "react";
import Link from "next/link";
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
import type { AdminProyecto } from "@/lib/admin/proyectos";

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

function ProyectoRow({
  proyecto,
  onDelete,
  isDeleting,
}: {
  proyecto: AdminProyecto;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proyecto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-[#e0e0e0] last:border-b-0 bg-white"
    >
      <td className="w-10 px-3 py-3 text-text-secondary">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 hover:text-[#1a1a1a] transition-colors"
          style={{ touchAction: "none" }}
          aria-label="Reordenar"
        >
          <DragHandleIcon />
        </button>
      </td>
      <td className="w-20 px-3 py-3">
        <div className="relative w-14 h-14 bg-bg-alt overflow-hidden rounded-sm">
          {proyecto.coverImage && (
            <Image
              src={proyecto.coverImage.src}
              alt={proyecto.coverImage.alt}
              fill
              className="object-cover"
              sizes="56px"
            />
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-[#1a1a1a] font-medium">
        {proyecto.nombre}
      </td>
      <td className="px-3 py-3 text-sm text-text-secondary">
        {proyecto.categoria}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/admin/proyectos/${proyecto.id}`}
            className="text-sm text-[#1a1a1a] font-medium border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-colors duration-200"
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={() => onDelete(proyecto.id)}
            disabled={isDeleting}
            className="text-sm text-red-600 border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProyectosTable({
  initialProyectos,
}: {
  initialProyectos: AdminProyecto[];
}) {
  const [proyectos, setProyectos] = useState(initialProyectos);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = proyectos.findIndex((p) => p.id === active.id);
    const newIndex = proyectos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousOrder = proyectos;
    const newOrderIds = arrayMove(proyectos, oldIndex, newIndex).map(
      (p) => p.id
    );
    const reordered = newOrderIds.map((id, index) => {
      const proyecto = previousOrder.find((p) => p.id === id)!;
      return { ...proyecto, orden: index };
    });

    setProyectos(reordered);

    const affected = reordered.filter((proyecto, index) => {
      const original = previousOrder.find((p) => p.id === proyecto.id);
      return original?.orden !== index;
    });

    if (affected.length === 0) return;

    const supabase = createClient();
    await Promise.all(
      affected.map((proyecto) =>
        supabase
          .from("proyectos")
          .update({ orden: proyecto.orden })
          .eq("id", proyecto.id)
      )
    );
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "¿Eliminar este proyecto? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    setDeletingId(id);
    const supabase = createClient();

    const { data: imagenes } = await supabase
      .from("proyecto_imagenes")
      .select("path")
      .eq("proyecto_id", id);

    const paths = (imagenes ?? [])
      .map((imagen) => imagen.path)
      .filter((path): path is string => Boolean(path));

    if (paths.length > 0) {
      await supabase.storage.from("proyectos").remove(paths);
    }

    const { error } = await supabase.from("proyectos").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      window.alert("No se pudo eliminar el proyecto.");
      return;
    }

    setProyectos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-[#1a1a1a]">
          Proyectos
        </h1>
        <Link
          href="/admin/proyectos/nuevo"
          className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200"
        >
          + Nuevo Proyecto
        </Link>
      </div>

      {proyectos.length === 0 ? (
        <p className="text-sm text-text-secondary">No hay proyectos todavía.</p>
      ) : (
        <div className="overflow-x-auto bg-white border border-[#e0e0e0] rounded-sm">
          <DndContext
            id="proyectos-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e0e0e0] text-left">
                  <th className="w-10 px-3 py-3" />
                  <th className="w-20 px-3 py-3" />
                  <th className="px-3 py-3 text-xs uppercase tracking-widest text-text-secondary font-normal">
                    Nombre
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-widest text-text-secondary font-normal">
                    Categoría
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-widest text-text-secondary font-normal text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={proyectos.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {proyectos.map((proyecto) => (
                    <ProyectoRow
                      key={proyecto.id}
                      proyecto={proyecto}
                      onDelete={handleDelete}
                      isDeleting={deletingId === proyecto.id}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  );
}
