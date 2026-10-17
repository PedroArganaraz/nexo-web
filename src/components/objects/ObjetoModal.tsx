'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { NexoObject } from '@/types'
import { whatsappHref } from '@/lib/whatsapp'

const EASE = [0.25, 0.1, 0.25, 1] as const

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.009a.75.75 0 0 0 .931.934l5.261-1.474A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.03-1.36l-.36-.214-3.733 1.046 1.058-3.636-.235-.374A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

export default function ObjetoModal({
  objeto,
  categoria,
  onClose,
}: {
  objeto: NexoObject
  categoria: string
  onClose: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const imagenes = objeto.galleryImages.length > 0 ? objeto.galleryImages : [objeto.coverImage]
  const total = imagenes.length

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

  const activeImage = imagenes[activeIndex]
  const consulta = whatsappHref(
    `Hola! Quiero consultar por "${objeto.name}" de Nexo Objects.`
  )

  return createPortal(
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
        role="dialog"
        aria-modal="true"
        aria-label={objeto.name}
        className="relative z-10 bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl flex flex-col md:flex-row"
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

        <div className="md:w-[58%] flex-shrink-0 flex flex-col">
          <div className="relative aspect-square w-full bg-[#f5f5f5]">
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

            {activeIndex > 0 && (
              <button
                onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                aria-label="Imagen anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M12 5l-5 5 5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {activeIndex < total - 1 && (
              <button
                onClick={() => setActiveIndex(i => Math.min(total - 1, i + 1))}
                aria-label="Imagen siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M8 5l5 5-5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {total > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-3 bg-white">
              {imagenes.map((img, i) => (
                <button
                  key={img.src + i}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  aria-current={i === activeIndex}
                  className={`relative aspect-square min-h-10 overflow-hidden rounded transition-opacity duration-200 ${
                    i === activeIndex
                      ? 'ring-2 ring-[#1a1a1a] opacity-100'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    className="object-cover"
                    style={{ objectPosition: `${img.focalX ?? 50}% ${img.focalY ?? 50}%` }}
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col p-6 md:p-8 md:pt-16">
          <span className="text-xs tracking-widest uppercase text-[#666666] mb-2">
            {categoria}
          </span>
          <h3 className="font-helvetica font-bold text-2xl md:text-3xl text-[#1a1a1a] mb-5 break-words">
            {objeto.name}
          </h3>
          {objeto.description && (
            <p className="text-[#666666] text-sm leading-relaxed whitespace-pre-line break-words">
              {objeto.description}
            </p>
          )}

          <a
            href={consulta}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 self-start inline-flex min-h-11 items-center gap-2 bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-accent transition-colors duration-200"
          >
            <WhatsAppIcon />
            Consultar por WhatsApp
          </a>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
