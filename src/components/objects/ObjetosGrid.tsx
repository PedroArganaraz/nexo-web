'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import type { NexoObject, ObjectSubcategory } from '@/types'
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
          {objeto.subcategory?.name ?? categoria}
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

const GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

function FiltroButton({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-full border px-5 text-sm transition-colors duration-200 cursor-pointer ${
        activo
          ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
          : 'bg-white border-[#e0e0e0] text-[#1a1a1a] hover:border-[#1a1a1a]'
      }`}
    >
      {children}
    </button>
  )
}

export default function ObjetosGrid({
  objetos,
  categoria,
  subcategorias,
}: {
  objetos: NexoObject[]
  categoria: string
  subcategorias: ObjectSubcategory[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [seleccionado, setSeleccionado] = useState<NexoObject | null>(null)
  const [filtro, setFiltro] = useState<string | null>(null)

  const conFiltros = subcategorias.length >= 2
  const visibles =
    conFiltros && filtro
      ? objetos.filter((objeto) => objeto.subcategory?.id === filtro)
      : objetos

  const cards = visibles.map((objeto, index) => (
    <ObjetoCard
      key={objeto.id}
      objeto={objeto}
      categoria={categoria}
      index={index}
      inView={inView}
      onClick={() => setSeleccionado(objeto)}
    />
  ))

  return (
    <>
      {conFiltros && (
        <div className="-mx-6 px-6 mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:overflow-visible">
          <div
            role="group"
            aria-label="Filtrar por subcategoría"
            className="flex w-max gap-2 md:w-auto md:flex-wrap"
          >
            <FiltroButton activo={filtro === null} onClick={() => setFiltro(null)}>
              Todas
            </FiltroButton>
            {subcategorias.map((subcategoria) => (
              <FiltroButton
                key={subcategoria.id}
                activo={filtro === subcategoria.id}
                onClick={() => setFiltro(subcategoria.id)}
              >
                {subcategoria.name}
              </FiltroButton>
            ))}
          </div>
        </div>
      )}

      {conFiltros ? (
        <div ref={ref}>
          <motion.div
            key={filtro ?? 'todas'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={GRID_CLASS}
          >
            {cards}
          </motion.div>
        </div>
      ) : (
        <div ref={ref} className={GRID_CLASS}>
          {cards}
        </div>
      )}

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
