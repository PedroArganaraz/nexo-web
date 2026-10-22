"use client";

import { useLayoutEffect, useRef } from "react";
import { formatearNumero } from "@/lib/precio";

export default function MontoInput({
  id,
  digitos,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  digitos: string;
  onChange: (digitos: string) => void;
  placeholder?: string;
  className: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretDigitosRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const digitosCaret = caretDigitosRef.current;
    caretDigitosRef.current = null;
    if (!input || digitosCaret === null || document.activeElement !== input) {
      return;
    }

    let posicion = 0;
    let vistos = 0;
    while (posicion < input.value.length && vistos < digitosCaret) {
      if (/\d/.test(input.value[posicion])) vistos += 1;
      posicion += 1;
    }
    input.setSelectionRange(posicion, posicion);
  }, [digitos]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { value, selectionStart } = e.target;
    const caret = selectionStart ?? value.length;
    const digitosAntes = value.slice(0, caret).replace(/\D/g, "");
    const ceros = digitosAntes.length - digitosAntes.replace(/^0+/, "").length;
    const limpio = value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);

    caretDigitosRef.current = Math.min(
      digitosAntes.length - ceros,
      limpio.length
    );
    onChange(limpio);
  }

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary"
      >
        $
      </span>
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={digitos === "" ? "" : formatearNumero(Number(digitos))}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} pl-8`}
      />
    </div>
  );
}
