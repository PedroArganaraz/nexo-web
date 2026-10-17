'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence } from 'framer-motion'
import type { NexoObject } from '@/types'
import ObjetoModal from './ObjetoModal'

export default function ObjetosGrid({
  objetos,
  categoria,
}: {
  objetos: NexoObject[]
  categoria: string
}) {
  const [seleccionado, setSeleccionado] = useState<NexoObject | null>(null)

  return (
    <>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8">
        {objetos.map((objeto) => (
          <li key={objeto.id}>
            <button
              type="button"
              onClick={() => setSeleccionado(objeto)}
              className="group block w-full text-left cursor-pointer"
              aria-label={`Ver ${objeto.name}`}
            >
              <span className="relative block aspect-square overflow-hidden bg-[#f5f5f5]">
                {objeto.coverImage.src && (
                  <Image
                    src={objeto.coverImage.src}
                    alt={objeto.coverImage.alt}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    style={{
                      objectPosition: `${objeto.coverImage.focalX ?? 50}% ${
                        objeto.coverImage.focalY ?? 50
                      }%`,
                    }}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                )}
              </span>
              <span className="block mt-3 font-helvetica font-semibold text-sm md:text-base text-[#1a1a1a] leading-snug break-words">
                {objeto.name}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-text-secondary text-xs tracking-wide">
                Ver detalle
              </span>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {seleccionado && (
          <ObjetoModal
            objeto={seleccionado}
            categoria={categoria}
            onClose={() => setSeleccionado(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
