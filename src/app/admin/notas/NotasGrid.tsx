"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Nota } from "@/types/database";

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6M5.5 6l.6 9.4A1.5 1.5 0 0 0 7.6 17h4.8a1.5 1.5 0 0 0 1.5-1.6L14.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 9.5v4M11.5 9.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatFecha(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

    if (diffDays >= 1) {
      return rtf.format(-diffDays, "day");
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours >= 1) {
      return rtf.format(-diffHours, "hour");
    }

    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return rtf.format(-diffMinutes, "minute");
  }

  return date.toLocaleDateString("es-AR");
}

export default function NotasGrid({
  initialNotas,
}: {
  initialNotas: Nota[];
}) {
  const router = useRouter();
  const [notas, setNotas] = useState(initialNotas);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: MouseEvent<HTMLButtonElement>, nota: Nota) {
    e.stopPropagation();

    const confirmed = window.confirm(
      `¿Eliminar la nota "${nota.titulo}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(nota.id);
    const supabase = createClient();
    const { error } = await supabase.from("notas").delete().eq("id", nota.id);
    setDeletingId(null);

    if (error) {
      window.alert("No se pudo eliminar la nota.");
      return;
    }

    setNotas((prev) => prev.filter((n) => n.id !== nota.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-text-secondary mb-1">
            Panel de administración
          </p>
          <h1 className="font-helvetica font-bold text-2xl text-[#1a1a1a]">
            Notas
          </h1>
        </div>
        <Link
          href="/admin/notas/nueva"
          className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-6 py-2.5 rounded-full hover:bg-accent transition-colors duration-200"
        >
          + Nueva nota
        </Link>
      </div>

      {notas.length === 0 ? (
        <p className="text-sm text-text-secondary">No hay notas todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notas.map((nota) => (
            <div
              key={nota.id}
              onClick={() => router.push(`/admin/notas/${nota.id}`)}
              className="flex flex-col bg-white border border-[#e0e0e0] rounded-sm p-5 cursor-pointer hover:border-[#1a1a1a] transition-colors duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-helvetica font-bold text-base text-[#1a1a1a] line-clamp-1">
                  {nota.titulo}
                </h2>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, nota)}
                  disabled={deletingId === nota.id}
                  aria-label={`Eliminar nota ${nota.titulo}`}
                  className="shrink-0 text-text-secondary hover:text-red-600 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon />
                </button>
              </div>

              <div
                className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-3"
                dangerouslySetInnerHTML={{ __html: nota.descripcion }}
              />

              <span className="text-xs text-text-secondary mt-auto">
                {formatFecha(nota.updated_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
