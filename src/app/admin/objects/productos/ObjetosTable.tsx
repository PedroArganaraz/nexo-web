"use client";

import { useState } from "react";
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import {
  OBJETOS_BUCKET,
  TODAS_LAS_CATEGORIAS,
} from "@/lib/objetos-constantes";
import type { AdminObjeto, AdminObjetoCategoria } from "@/lib/admin/objetos";
import DragHandleIcon from "../DragHandleIcon";
import ToggleActivo from "../ToggleActivo";

const GRID_MD =
  "md:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_8rem_7rem_11rem]";

const headerCellClass =
  "text-xs uppercase tracking-widest text-text-secondary font-normal";

const editButtonClass =
  "inline-flex min-h-10 items-center text-sm text-[#1a1a1a] font-medium border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-colors duration-200 md:min-h-0";

const deleteButtonClass =
  "inline-flex min-h-10 items-center text-sm text-red-600 border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed md:min-h-0";

type RowActions = {
  onDelete: (objeto: AdminObjeto) => void;
  isDeleting: boolean;
  onToggleActivo: (objeto: AdminObjeto) => void;
  isToggling: boolean;
};

function ObjetoRowContent({
  objeto,
  categoriaNombre,
  handle,
  onDelete,
  isDeleting,
  onToggleActivo,
  isToggling,
}: RowActions & {
  objeto: AdminObjeto;
  categoriaNombre: string;
  handle: React.ReactNode;
}) {
  const dimClass = objeto.activo ? "" : "opacity-40";

  return (
    <>
      {handle}

      <div
        className={`relative w-14 h-14 bg-bg-alt overflow-hidden rounded-sm transition-opacity duration-200 ${dimClass}`}
      >
        {objeto.coverImage && (
          <Image
            src={objeto.coverImage.src}
            alt={objeto.coverImage.alt}
            fill
            className="object-cover"
            sizes="56px"
            style={{
              objectPosition: `${objeto.coverImage.focalX}% ${objeto.coverImage.focalY}%`,
            }}
          />
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`text-sm text-[#1a1a1a] font-medium break-words transition-opacity duration-200 ${dimClass}`}
        >
          {objeto.nombre}
        </p>
        {!objeto.coverImage && (
          <span className="inline-block mt-1 text-xs text-text-secondary bg-bg-alt rounded-full px-2 py-0.5">
            Sin imágenes
          </span>
        )}
        <p
          className={`md:hidden mt-1 text-xs text-text-secondary transition-opacity duration-200 ${dimClass}`}
        >
          {categoriaNombre}
        </p>
      </div>

      <p
        className={`hidden md:block text-sm text-text-secondary break-words transition-opacity duration-200 ${dimClass}`}
      >
        {categoriaNombre}
      </p>

      <div className="col-span-3 flex flex-wrap items-center justify-between gap-2 md:contents">
        <div className="flex md:justify-center">
          <ToggleActivo
            checked={objeto.activo}
            onChange={() => onToggleActivo(objeto)}
            disabled={isToggling}
          >
            <span
              className={`text-xs ${
                objeto.activo ? "text-text-secondary" : "text-red-600 font-medium"
              }`}
            >
              {objeto.activo ? "Activo" : "Inactivo"}
            </span>
          </ToggleActivo>
        </div>

        <div className="flex items-center gap-2 md:justify-center">
          <Link
            href={`/admin/objects/productos/${objeto.id}`}
            className={editButtonClass}
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={() => onDelete(objeto)}
            disabled={isDeleting}
            className={deleteButtonClass}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </>
  );
}

const rowClass = `grid grid-cols-[2.5rem_3.5rem_minmax(0,1fr)] ${GRID_MD} items-center gap-x-3 gap-y-2 px-3 py-3 border-b border-[#e0e0e0] last:border-b-0 bg-white`;

function SortableObjetoRow(
  props: RowActions & { objeto: AdminObjeto; categoriaNombre: string }
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.objeto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={rowClass}>
      <ObjetoRowContent
        {...props}
        handle={
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
        }
      />
    </div>
  );
}

function StaticObjetoRow(
  props: RowActions & { objeto: AdminObjeto; categoriaNombre: string }
) {
  return (
    <div className={rowClass}>
      <ObjetoRowContent {...props} handle={<span aria-hidden="true" />} />
    </div>
  );
}

function ListHeader() {
  return (
    <div
      className={`hidden md:grid ${GRID_MD} items-center gap-x-3 px-3 py-3 border-b border-[#e0e0e0]`}
    >
      <span />
      <span />
      <span className={headerCellClass}>Nombre</span>
      <span className={headerCellClass}>Categoría</span>
      <span className={`${headerCellClass} text-center`}>Estado</span>
      <span className={`${headerCellClass} text-center`}>Acciones</span>
    </div>
  );
}

function byOrden(a: AdminObjeto, b: AdminObjeto) {
  return a.orden - b.orden;
}

export default function ObjetosTable({
  categorias,
  initialObjetos,
  initialSeleccion,
}: {
  categorias: AdminObjetoCategoria[];
  initialObjetos: AdminObjeto[];
  initialSeleccion: string;
}) {
  const [objetos, setObjetos] = useState(initialObjetos);
  const [seleccion, setSeleccion] = useState(initialSeleccion);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));
  const esTodas = seleccion === TODAS_LAS_CATEGORIAS;
  const listaCategoria = esTodas
    ? []
    : objetos.filter((o) => o.categoria_id === seleccion).sort(byOrden);
  const grupos = esTodas
    ? categorias
        .map((categoria) => ({
          categoria,
          objetos: objetos
            .filter((o) => o.categoria_id === categoria.id)
            .sort(byOrden),
        }))
        .filter((grupo) => grupo.objetos.length > 0)
    : [];

  const nuevoHref = esTodas
    ? "/admin/objects/productos/nuevo"
    : `/admin/objects/productos/nuevo?categoria=${seleccion}`;

  function handleSeleccion(value: string) {
    setSeleccion(value);
    window.history.replaceState(
      null,
      "",
      `/admin/objects/productos?categoria=${value}`
    );
  }

  function avisarSiCategoriaQuedaOculta(
    objeto: AdminObjeto,
    restantes: AdminObjeto[]
  ) {
    const categoria = categoriaPorId.get(objeto.categoria_id);
    if (!categoria?.activo) return;
    const quedanActivos = restantes.some(
      (o) => o.categoria_id === objeto.categoria_id && o.activo
    );
    if (!quedanActivos) {
      toast.info(
        `La categoría "${categoria.nombre}" queda oculta en el sitio porque no tiene productos activos.`
      );
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (esTodas || !over || active.id === over.id) return;

    const oldIndex = listaCategoria.findIndex((o) => o.id === active.id);
    const newIndex = listaCategoria.findIndex((o) => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = objetos;
    const reordered = arrayMove(listaCategoria, oldIndex, newIndex).map(
      (objeto, index) => ({ ...objeto, orden: index })
    );
    const nuevoOrden = new Map(reordered.map((o) => [o.id, o.orden]));

    setObjetos((prev) =>
      prev.map((o) =>
        nuevoOrden.has(o.id) ? { ...o, orden: nuevoOrden.get(o.id)! } : o
      )
    );

    const affected = reordered.filter((objeto) => {
      const original = listaCategoria.find((o) => o.id === objeto.id);
      return original?.orden !== objeto.orden;
    });

    if (affected.length === 0) return;

    const supabase = createClient();
    const results = await Promise.all(
      affected.map((objeto) =>
        supabase
          .from("objetos")
          .update({ orden: objeto.orden })
          .eq("id", objeto.id)
      )
    );

    if (results.some((result) => result.error)) {
      setObjetos(previous);
      window.alert("No se pudo guardar el nuevo orden.");
    }
  }

  async function handleToggleActivo(objeto: AdminObjeto) {
    const nextActivo = !objeto.activo;

    if (nextActivo && !objeto.coverImage) {
      window.alert(
        "Para activar el producto tiene que tener al menos una imagen. Editalo y agregá una."
      );
      return;
    }

    const previous = objetos;
    const actualizados = objetos.map((o) =>
      o.id === objeto.id ? { ...o, activo: nextActivo } : o
    );

    setObjetos(actualizados);
    setTogglingId(objeto.id);

    const supabase = createClient();
    const { error } = await supabase
      .from("objetos")
      .update({ activo: nextActivo })
      .eq("id", objeto.id);

    setTogglingId(null);

    if (error) {
      setObjetos(previous);
      window.alert("No se pudo actualizar el estado del producto.");
      return;
    }

    if (!nextActivo) {
      avisarSiCategoriaQuedaOculta(objeto, actualizados);
    }
  }

  async function handleDelete(objeto: AdminObjeto) {
    const confirmed = window.confirm(
      `¿Eliminar el producto "${objeto.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(objeto.id);
    const supabase = createClient();

    const { data: imagenes, error: imagenesError } = await supabase
      .from("objeto_imagenes")
      .select("path")
      .eq("objeto_id", objeto.id);

    if (imagenesError) {
      setDeletingId(null);
      window.alert("No se pudo eliminar el producto.");
      return;
    }

    const { error } = await supabase
      .from("objetos")
      .delete()
      .eq("id", objeto.id);

    if (error) {
      setDeletingId(null);
      window.alert("No se pudo eliminar el producto.");
      return;
    }

    const paths = (imagenes ?? [])
      .map((imagen) => imagen.path)
      .filter((path): path is string => Boolean(path));

    if (paths.length > 0) {
      await supabase.storage.from(OBJETOS_BUCKET).remove(paths);
    }

    const restantes = objetos.filter((o) => o.id !== objeto.id);
    setDeletingId(null);
    setObjetos(restantes);

    if (objeto.activo) {
      avisarSiCategoriaQuedaOculta(objeto, restantes);
    }
  }

  const rowProps = (objeto: AdminObjeto) => ({
    objeto,
    categoriaNombre:
      categoriaPorId.get(objeto.categoria_id)?.nombre ?? objeto.categoriaNombre,
    onDelete: handleDelete,
    isDeleting: deletingId === objeto.id,
    onToggleActivo: handleToggleActivo,
    isToggling: togglingId === objeto.id,
  });

  const opciones = [
    { value: TODAS_LAS_CATEGORIAS, label: "Todas", count: objetos.length },
    ...categorias.map((categoria) => ({
      value: categoria.id,
      label: categoria.nombre,
      count: objetos.filter((o) => o.categoria_id === categoria.id).length,
    })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-helvetica font-bold text-lg text-[#1a1a1a]">
          Productos
        </h2>
        <Link
          href={nuevoHref}
          className="inline-flex min-h-10 items-center bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="-mx-6 px-6 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:overflow-visible">
        <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {opciones.map((opcion) => {
            const isActive = seleccion === opcion.value;
            return (
              <button
                key={opcion.value}
                type="button"
                onClick={() => handleSeleccion(opcion.value)}
                aria-pressed={isActive}
                className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "border-[#1a1a1a] bg-white text-[#1a1a1a] font-medium"
                    : "border-transparent text-text-secondary hover:text-[#1a1a1a]"
                }`}
              >
                {opcion.label}
                <span className="text-xs text-text-secondary">
                  {opcion.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {esTodas && objetos.length > 0 && (
        <p className="text-xs text-text-secondary mb-4">
          Para cambiar el orden, elegí una categoría.
        </p>
      )}

      {esTodas ? (
        grupos.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No hay productos todavía.
          </p>
        ) : (
          <div className="bg-white border border-[#e0e0e0] rounded-sm">
            <ListHeader />
            {grupos.map((grupo) => (
              <div
                key={grupo.categoria.id}
                className="border-b border-[#e0e0e0] last:border-b-0"
              >
                <p className="px-3 py-2 bg-bg-alt border-b border-[#e0e0e0] text-xs uppercase tracking-widest text-text-secondary">
                  {grupo.categoria.nombre}
                </p>
                {grupo.objetos.map((objeto) => (
                  <StaticObjetoRow key={objeto.id} {...rowProps(objeto)} />
                ))}
              </div>
            ))}
          </div>
        )
      ) : listaCategoria.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No hay productos en esta categoría todavía.
        </p>
      ) : (
        <div className="bg-white border border-[#e0e0e0] rounded-sm">
          <ListHeader />
          <DndContext
            id="objetos-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={listaCategoria.map((o) => o.id)}
              strategy={verticalListSortingStrategy}
            >
              {listaCategoria.map((objeto) => (
                <SortableObjetoRow key={objeto.id} {...rowProps(objeto)} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
