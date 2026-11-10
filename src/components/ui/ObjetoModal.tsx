'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { NexoObject } from '@/types'
import { whatsappHref } from '@/lib/contacto'
import { formatearPrecio } from '@/lib/precio'
import { copiarTexto, puedeCompartirNativo, urlAbsoluta } from '@/lib/compartir'

const EASE = [0.25, 0.1, 0.25, 1] as const

type EstadoCopia = 'idle' | 'copiado' | 'error'

function suscribirseSinCambios() {
  return () => {}
}

export default function ObjetoModal({
  objeto,
  categoria,
  ruta,
  onClose,
}: {
  objeto: NexoObject
  categoria: string
  ruta: string
  onClose: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [estadoCopia, setEstadoCopia] = useState<EstadoCopia>('idle')
  const timerCopiaRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const compartirNativo = useSyncExternalStore(
    suscribirseSinCambios,
    puedeCompartirNativo,
    () => false
  )
  const imagenes =
    objeto.galleryImages.length > 0 ? objeto.galleryImages : [objeto.coverImage]
  const total = imagenes.length
  const tieneGaleria = total > 1

  useEffect(() => {
    return () => {
      if (timerCopiaRef.current) clearTimeout(timerCopiaRef.current)
    }
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setActiveIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setActiveIndex(i => Math.min(total - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, total])

  const prev = () => setActiveIndex(i => Math.max(0, i - 1))
  const next = () => setActiveIndex(i => Math.min(total - 1, i + 1))

  const activeImage = imagenes[activeIndex]
  const mensaje = `Hola! Quisiera consultar por ${objeto.name} (${categoria}).`

  function handleConsultar(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.href = whatsappHref(`${mensaje} ${urlAbsoluta(ruta)}`)
  }

  function mostrarEstadoCopia(estado: EstadoCopia) {
    setEstadoCopia(estado)
    if (timerCopiaRef.current) clearTimeout(timerCopiaRef.current)
    timerCopiaRef.current = setTimeout(() => setEstadoCopia('idle'), 2000)
  }

  async function handleCompartir() {
    const url = urlAbsoluta(ruta)

    if (compartirNativo) {
      try {
        await navigator.share({ title: `${objeto.name} | Nexo Objects`, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    mostrarEstadoCopia((await copiarTexto(url)) ? 'copiado' : 'error')
  }

  const textoCompartir =
    estadoCopia === 'copiado'
      ? 'Link copiado'
      : estadoCopia === 'error'
        ? 'No se pudo copiar'
        : compartirNativo
          ? 'Compartir'
          : 'Copiar link'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 w-full max-w-5xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: EASE }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full text-[#666666] hover:text-[#1a1a1a] shadow-sm transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div
          role="dialog"
          aria-modal="true"
          aria-label={objeto.name}
          className="bg-white max-h-[90vh] overflow-y-auto overscroll-contain rounded-xl flex flex-col md:flex-row"
        >
          <div className="md:w-[58%] flex-shrink-0 flex flex-col">
            <div className="relative aspect-square w-full bg-[#f5f5f5] overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
              {activeImage.src && (
                <Image
                  key={activeImage.src}
                  src={activeImage.src}
                  alt={activeImage.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 58vw"
                />
              )}

              {tieneGaleria && activeIndex > 0 && (
                <button
                  onClick={prev}
                  aria-label="Imagen anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                    <path d="M12 5l-5 5 5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              {tieneGaleria && activeIndex < total - 1 && (
                <button
                  onClick={next}
                  aria-label="Imagen siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                    <path d="M8 5l5 5-5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              {tieneGaleria && (
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 rounded-full bg-black/30 px-2 py-1.5"
                  aria-hidden="true"
                >
                  {imagenes.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === activeIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {tieneGaleria && (
              <div className="flex gap-2 p-3 bg-white overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {imagenes.map((img, i) => (
                  <button
                    key={`${img.src}-${i}`}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    aria-current={i === activeIndex}
                    className={`relative w-14 shrink-0 md:w-auto md:flex-1 md:max-w-20 aspect-square overflow-hidden rounded transition-opacity duration-200 ${
                      i === activeIndex
                        ? 'ring-2 ring-inset ring-[#1a1a1a] opacity-100'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt=""
                      fill
                      className="object-cover"
                      style={{
                        objectPosition: `${img.focalX ?? 50}% ${img.focalY ?? 50}%`,
                      }}
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col p-6 md:p-8 md:pt-16">
            <span className="text-xs tracking-widest uppercase text-[#666666] mb-2">
              {objeto.subcategory
                ? `${categoria} · ${objeto.subcategory.name}`
                : categoria}
            </span>
            <h3 className="font-helvetica font-bold text-2xl md:text-3xl text-[#1a1a1a] mb-5 break-words">
              {objeto.name}
            </h3>
            {objeto.description && (
              <p className="text-[#666666] text-sm leading-relaxed whitespace-pre-line break-words md:mb-6">
                {objeto.description}
              </p>
            )}

            <div className="mt-6 md:mt-auto flex flex-col items-start gap-4">
              {objeto.price !== null && (
                <p className="font-helvetica font-bold text-2xl md:text-3xl text-[#1a1a1a] break-words">
                  Precio: {formatearPrecio(objeto.price)}
                </p>
              )}
              <div className="flex w-fit max-w-full flex-col items-stretch gap-3">
                <a
                  href={whatsappHref(mensaje)}
                  onClick={handleConsultar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center text-center border border-[#1a1a1a] bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-widest px-6 md:px-3 lg:px-6 py-3 rounded-full hover:bg-accent hover:border-accent transition-colors duration-200"
                >
                  Consultar por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={handleCompartir}
                  className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#1a1a1a] text-[#1a1a1a] text-xs font-semibold uppercase tracking-widest px-6 md:px-3 lg:px-6 py-3 rounded-full hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
                    <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {textoCompartir}
                </button>
              </div>
              <span className="sr-only" aria-live="polite">
                {estadoCopia === 'copiado'
                  ? 'Link copiado'
                  : estadoCopia === 'error'
                    ? 'No se pudo copiar el link'
                    : ''}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
