'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import type { NexoObject } from '@/types'
import ObjetoModal from '@/components/ui/ObjetoModal'

const EASE = [0.25, 0.1, 0.25, 1] as const

function ObjetoCard({
  objeto,
  categoria,
  index,
  inView,
  onClick,
}: {
  objeto: NexoObject
  categoria: string
  index: number
  inView: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.1 }}
      onClick={onClick}
      className="group relative w-full overflow-hidden aspect-square cursor-pointer text-left bg-[#f5f5f5]"
      aria-label={`Ver producto ${objeto.name}`}
    >
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
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:opacity-80" />

      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <span className="block text-xs tracking-widest uppercase text-white/70 mb-1">
          {categoria}
        </span>
        <span className="block font-helvetica font-semibold text-white text-base md:text-lg leading-snug uppercase tracking-wide break-words">
          {objeto.name}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 text-white/60 text-xs tracking-wide">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 8h4M8 6l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver producto
        </span>
      </div>
    </motion.button>
  )
}

export default function ObjetosGrid({
  objetos,
  categoria,
}: {
  objetos: NexoObject[]
  categoria: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [seleccionado, setSeleccionado] = useState<NexoObject | null>(null)

  return (
    <>
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {objetos.map((objeto, index) => (
          <ObjetoCard
            key={objeto.id}
            objeto={objeto}
            categoria={categoria}
            index={index}
            inView={inView}
            onClick={() => setSeleccionado(objeto)}
          />
        ))}
      </div>

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
