"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Nota } from "@/types/database";

const inputClass =
  "w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200";

const labelClass =
  "block text-xs uppercase tracking-widest text-text-secondary mb-1.5";

// Solo se permiten estas etiquetas (formato simple de negrita/cursiva/
// subrayado + saltos de línea) y ningún atributo. Cualquier otra etiqueta
// se "desenvuelve" preservando su texto; los atributos siempre se eliminan.
const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "BR"]);

function sanitizeHtml(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;

  function clean(node: Node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;

      if (
        child.nodeType !== Node.ELEMENT_NODE ||
        !ALLOWED_TAGS.has((child as Element).tagName)
      ) {
        while (child.firstChild) {
          node.insertBefore(child.firstChild, child);
        }
        node.removeChild(child);
        return;
      }

      const element = child as Element;
      while (element.attributes.length > 0) {
        element.removeAttribute(element.attributes[0].name);
      }
      clean(element);
    });
  }

  clean(template.content);
  return template.innerHTML;
}

export default function NotaForm({ nota }: { nota?: Nota }) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditMode = Boolean(nota);

  const [titulo, setTitulo] = useState(nota?.titulo ?? "");
  const [saving, setSaving] = useState(false);

  function applyFormat(command: "bold" | "italic" | "underline") {
    editorRef.current?.focus();
    document.execCommand(command);
  }

  async function handleSave() {
    if (!titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }

    const rawHtml = editorRef.current?.innerHTML ?? "";
    const descripcion = sanitizeHtml(rawHtml);

    setSaving(true);
    const supabase = createClient();

    if (isEditMode && nota) {
      const { error } = await supabase
        .from("notas")
        .update({
          titulo: titulo.trim(),
          descripcion,
        })
        .eq("id", nota.id);

      setSaving(false);

      if (error) {
        toast.error("No se pudo guardar la nota.");
        return;
      }

      toast.success("Nota actualizada.");
      router.push("/admin/notas");
      return;
    }

    const { error } = await supabase.from("notas").insert({
      titulo: titulo.trim(),
      descripcion,
    });

    setSaving(false);

    if (error) {
      toast.error("No se pudo crear la nota.");
      return;
    }

    toast.success("Nota creada.");
    router.push("/admin/notas");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-heading font-bold text-2xl text-[#1a1a1a] mb-6">
        {isEditMode ? "Editar nota" : "Nueva nota"}
      </h1>

      <div className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de la nota"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <div className="border border-[#e0e0e0] rounded-sm overflow-hidden">
            <div className="flex items-center gap-1 border-b border-[#e0e0e0] bg-bg-alt px-2 py-1.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat("bold")}
                aria-label="Negrita"
                className="w-7 h-7 flex items-center justify-center rounded-sm text-sm font-bold text-[#1a1a1a] hover:bg-white transition-colors duration-150 cursor-pointer"
              >
                N
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat("italic")}
                aria-label="Cursiva"
                className="w-7 h-7 flex items-center justify-center rounded-sm text-sm italic text-[#1a1a1a] hover:bg-white transition-colors duration-150 cursor-pointer"
              >
                K
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormat("underline")}
                aria-label="Subrayado"
                className="w-7 h-7 flex items-center justify-center rounded-sm text-sm underline text-[#1a1a1a] hover:bg-white transition-colors duration-150 cursor-pointer"
              >
                S
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: nota?.descripcion ?? "" }}
              className="min-h-[320px] px-4 py-3 text-sm text-[#1a1a1a] bg-white outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-8 py-3 rounded-full hover:bg-accent transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : "Guardar nota"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/notas")}
            disabled={saving}
            className="text-sm text-[#1a1a1a] border border-[#1a1a1a] rounded-full px-6 py-3 hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
