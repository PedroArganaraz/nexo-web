"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Categoria } from "@/types/database";
import CategoriaModal from "./CategoriaModal";

type ModalState = { mode: "create" } | { mode: "edit"; categoria: Categoria };

export default function CategoriasTable({
  initialCategorias,
}: {
  initialCategorias: Categoria[];
}) {
  const [categorias, setCategorias] = useState(initialCategorias);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(categoria: Categoria) {
    const supabase = createClient();

    const { count } = await supabase
      .from("proyectos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", categoria.id);

    const usageWarning =
      count && count > 0
        ? ` Hay ${count} proyecto${
            count === 1 ? "" : "s"
          } usando esta categoría; quedarán sin categoría asignada.`
        : "";

    const confirmed = window.confirm(
      `¿Eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.${usageWarning}`
    );
    if (!confirmed) return;

    setDeletingId(categoria.id);
    const { error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", categoria.id);
    setDeletingId(null);

    if (error) {
      window.alert("No se pudo eliminar la categoría.");
      return;
    }

    setCategorias((prev) => prev.filter((c) => c.id !== categoria.id));
  }

  function handleSaved(categoria: Categoria) {
    setCategorias((prev) => {
      const exists = prev.some((c) => c.id === categoria.id);
      const next = exists
        ? prev.map((c) => (c.id === categoria.id ? categoria : c))
        : [...prev, categoria];
      return next.slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    setModalState(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-secondary mb-1">
            Panel de administración
          </p>
          <h1 className="font-helvetica font-bold text-2xl text-[#1a1a1a]">
            Categorías
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setModalState({ mode: "create" })}
          className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer"
        >
          + Nueva categoría
        </button>
      </div>

      {categorias.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No hay categorías todavía.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white border border-[#e0e0e0] rounded-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-left">
                <th className="px-3 py-3 text-xs uppercase tracking-widest text-text-secondary font-normal">
                  Nombre
                </th>
                <th className="px-3 py-3 text-xs uppercase tracking-widest text-text-secondary font-normal text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr
                  key={categoria.id}
                  className="border-b border-[#e0e0e0] last:border-b-0 bg-white"
                >
                  <td className="px-3 py-3 text-sm text-[#1a1a1a] font-medium">
                    {categoria.nombre}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setModalState({ mode: "edit", categoria })
                        }
                        className="text-sm text-[#1a1a1a] font-medium border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-colors duration-200"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(categoria)}
                        disabled={deletingId === categoria.id}
                        className="text-sm text-red-600 border border-[#e0e0e0] rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === categoria.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalState && (
        <CategoriaModal
          categoria={modalState.mode === "edit" ? modalState.categoria : null}
          onSaved={handleSaved}
          onCancel={() => setModalState(null)}
        />
      )}
    </div>
  );
}
