'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import type { ObjectCategory } from '@/types'

const EASE = [0.25, 0.1, 0.25, 1] as const

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 8h4M8 6l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CategoriaCard({
  categoria,
  index,
  inView,
}: {
  categoria: ObjectCategory
  index: number
  inView: boolean
}) {
  const conImagen = Boolean(categoria.image)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.1 }}
    >
      <Link
        href={`/objects/${categoria.slug}`}
        className="group relative block w-full overflow-hidden aspect-square bg-[#f5f5f5]"
        aria-label={`Ver productos de ${categoria.name}`}
      >
        {categoria.image && (
          <>
            <Image
              src={categoria.image.src}
              alt={categoria.image.alt}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              style={{
                objectPosition: `${categoria.image.focalX ?? 50}% ${
                  categoria.image.focalY ?? 50
                }%`,
              }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:opacity-80" />
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
          <span
            className={`block font-helvetica font-semibold text-base md:text-lg leading-snug uppercase tracking-wide break-words ${
              conImagen ? 'text-white' : 'text-[#1a1a1a]'
            }`}
          >
            {categoria.name}
          </span>
          <span
            className={`mt-2 inline-flex items-center gap-1 text-xs tracking-wide ${
              conImagen ? 'text-white/60' : 'text-[#666666]'
            }`}
          >
            <ArrowIcon />
            Ver productos
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function CategoriasGrid({
  categorias,
}: {
  categorias: ObjectCategory[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categorias.map((categoria, index) => (
        <CategoriaCard
          key={categoria.id}
          categoria={categoria}
          index={index}
          inView={inView}
        />
      ))}
    </div>
  )
}
