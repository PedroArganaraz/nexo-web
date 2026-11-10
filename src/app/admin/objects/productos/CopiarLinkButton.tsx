"use client";

import { toast } from "sonner";
import { copiarTexto, urlAbsoluta } from "@/lib/compartir";

export function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path
        d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CopiarLinkButton({
  ruta,
  disabled,
  className,
}: {
  ruta: string | null;
  disabled?: boolean;
  className: string;
}) {
  async function handleCopiar() {
    if (!ruta) return;
    if (await copiarTexto(urlAbsoluta(ruta))) {
      toast.success("Link copiado");
    } else {
      toast.error("No se pudo copiar el link. Copialo a mano.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopiar}
      disabled={disabled || !ruta}
      className={className}
    >
      <LinkIcon />
      Copiar link
    </button>
  );
}
