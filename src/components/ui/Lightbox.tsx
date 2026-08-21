'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Project } from '@/types'
import ComparadorModal from './ComparadorModal'

interface LightboxProps {
  project: Project
  onClose: () => void
}

const EASE = [0.25, 0.1, 0.25, 1] as const

export default function Lightbox({ project, onClose }: LightboxProps) {
  const [mounted, setMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showComparador, setShowComparador] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const total = project.galleryImages.length
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setActiveIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setActiveIndex(i => Math.min(total - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, project.galleryImages.length])

  const prev = () => setActiveIndex(i => Math.max(0, i - 1))
  const next = () => setActiveIndex(i => Math.min(project.galleryImages.length - 1, i + 1))

  if (!mounted) return null

  const activeImage = project.galleryImages[activeIndex]

  return createPortal(
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl flex flex-col md:flex-row"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left: gallery ── */}
        <div className="md:w-[58%] flex-shrink-0 flex flex-col">
          {/* Main image */}
          <div className="relative aspect-[4/3] w-full bg-[#f5f5f5]">
            <Image
              key={activeImage.src}
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              className="object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none"
              style={{
                objectPosition: `${activeImage.focalX ?? 50}% ${
                  activeImage.focalY ?? 50
                }%`,
              }}
              sizes="(max-width: 768px) 100vw, 58vw"
            />

            {/* Prev */}
            {activeIndex > 0 && (
              <button
                onClick={prev}
                aria-label="Imagen anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M12 5l-5 5 5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* Next */}
            {activeIndex < project.galleryImages.length - 1 && (
              <button
                onClick={next}
                aria-label="Imagen siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M8 5l5 5-5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {/* Dot indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {project.galleryImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Ir a imagen ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 p-3 bg-white">
            {project.galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={`relative flex-1 aspect-[4/3] overflow-hidden rounded transition-opacity duration-200 ${
                  i === activeIndex
                    ? 'ring-2 ring-[#1a1a1a] opacity-100'
                    : 'opacity-40 hover:opacity-70'
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: `${img.focalX ?? 50}% ${
                      img.focalY ?? 50
                    }%`,
                  }}
                  sizes="15vw"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: info ── */}
        <div className="flex-1 flex flex-col p-8">
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="self-end w-8 h-8 flex items-center justify-center text-[#666666] hover:text-[#1a1a1a] transition-colors mb-6"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <span className="text-xs tracking-widest uppercase text-[#666666] mb-2">
            {project.category}
          </span>
          <h3 className="font-helvetica font-bold text-2xl md:text-3xl text-[#1a1a1a] mb-5">
            {project.title}
          </h3>
          <p className="text-[#666666] text-sm leading-relaxed">
            {project.description}
          </p>

          {project.comparisons && project.comparisons.length > 0 && (
            <button
              onClick={() => setShowComparador(true)}
              className="mt-6 self-start bg-[#1a1a1a] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-accent transition-colors duration-200"
            >
              Ver antes y después
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>

    {showComparador && project.comparisons && (
      <ComparadorModal
        comparisons={project.comparisons}
        onClose={() => setShowComparador(false)}
      />
    )}
    </>,
    document.body
  )
}
