'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ProjectComparison } from '@/types'
import { precargarImagen } from '@/lib/imagenes'

interface ComparadorModalProps {
  comparisons: ProjectComparison[]
  onClose: () => void
}

type Lado = 'antes' | 'despues'

const EASE = [0.25, 0.1, 0.25, 1] as const

function Spinner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full border-2 motion-safe:animate-spin ${className}`}
    />
  )
}

export default function ComparadorModal({ comparisons, onClose }: ComparadorModalProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lado, setLado] = useState<Lado>('antes')
  const [cargadas, setCargadas] = useState<Set<string>>(() => new Set())

  const active = comparisons[activeIndex]
  const antesCargada = cargadas.has(active.antesUrl)
  const despuesCargada = cargadas.has(active.despuesUrl)
  const mostrarDespues = lado === 'despues' && despuesCargada
  const esperandoDespues = lado === 'despues' && !despuesCargada
  const cargando = !antesCargada || esperandoDespues

  function marcarCargada(url: string) {
    setCargadas(prev => (prev.has(url) ? prev : new Set(prev).add(url)))
  }

  useEffect(() => {
    if (!antesCargada || !despuesCargada) return
    const siguiente = comparisons[activeIndex + 1]
    if (!siguiente) return
    precargarImagen(siguiente.antesUrl, 'low')
    precargarImagen(siguiente.despuesUrl, 'low')
  }, [antesCargada, despuesCargada, activeIndex, comparisons])

  function goTo(index: number) {
    setActiveIndex(index)
    setLado('antes')
  }

  const prev = () => goTo(Math.max(0, activeIndex - 1))
  const next = () => goTo(Math.min(comparisons.length - 1, activeIndex + 1))

  const segmentoClass = (activo: boolean) =>
    `inline-flex min-h-10 min-w-28 items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
      activo
        ? 'bg-[#1a1a1a] text-white'
        : 'text-[#1a1a1a] hover:bg-[#1a1a1a]/10'
    }`

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-black/85"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Antes y después"
        className="relative z-10 bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar comparador"
          className="absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full text-[#666666] hover:text-[#1a1a1a] hover:bg-white shadow-sm transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="relative w-full aspect-[1080/672] overflow-hidden bg-[#f5f5f5] select-none">
          <Image
            key={active.antesUrl}
            src={active.antesUrl}
            alt="Antes"
            fill
            loading="eager"
            fetchPriority="high"
            onLoad={() => marcarCargada(active.antesUrl)}
            onError={() => marcarCargada(active.antesUrl)}
            className={`object-cover transition-opacity duration-300 motion-reduce:transition-none ${
              antesCargada && !mostrarDespues ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, 768px"
          />
          <Image
            key={active.despuesUrl}
            src={active.despuesUrl}
            alt="Después"
            fill
            loading="eager"
            fetchPriority="auto"
            onLoad={() => marcarCargada(active.despuesUrl)}
            onError={() => marcarCargada(active.despuesUrl)}
            className={`object-cover transition-opacity duration-300 motion-reduce:transition-none ${
              mostrarDespues ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, 768px"
          />

          {!antesCargada && (
            <div
              className="absolute inset-0 bg-[#ececec] motion-safe:animate-pulse"
              aria-hidden="true"
            />
          )}

          {cargando && (
            <div
              role="status"
              aria-label={esperandoDespues ? 'Cargando la imagen de después' : 'Cargando la imagen'}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 shadow-sm">
                <Spinner className="h-6 w-6 border-[#1a1a1a]/15 border-t-[#1a1a1a]/70" />
              </span>
            </div>
          )}

          {(antesCargada || mostrarDespues) && (
            <span className="absolute top-3 left-3 bg-black/70 text-white text-[11px] uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
              {mostrarDespues ? 'Después' : 'Antes'}
            </span>
          )}

          {activeIndex > 0 && (
            <button
              onClick={prev}
              aria-label="Par anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M12 5l-5 5 5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {activeIndex < comparisons.length - 1 && (
            <button
              onClick={next}
              aria-label="Par siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M8 5l5 5-5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 px-3 py-3">
          <div
            role="group"
            aria-label="Elegir imagen"
            className="inline-flex rounded-full border border-[#1a1a1a] p-0.5"
          >
            <button
              type="button"
              onClick={() => setLado('antes')}
              aria-pressed={lado === 'antes'}
              className={segmentoClass(lado === 'antes')}
            >
              Antes
            </button>
            <button
              type="button"
              onClick={() => setLado('despues')}
              aria-pressed={lado === 'despues'}
              aria-busy={esperandoDespues}
              className={segmentoClass(lado === 'despues')}
            >
              {esperandoDespues && (
                <Spinner className="h-3.5 w-3.5 border-white/30 border-t-white" />
              )}
              Después
            </button>
          </div>

          {comparisons.length > 1 && (
            <div className="flex flex-wrap justify-center">
              {comparisons.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir al par ${i + 1}`}
                  aria-current={i === activeIndex}
                  className="flex h-10 w-10 items-center justify-center cursor-pointer"
                >
                  <span
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i === activeIndex ? 'bg-[#1a1a1a]' : 'bg-[#1a1a1a]/25'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
