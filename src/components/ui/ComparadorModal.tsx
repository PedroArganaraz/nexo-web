'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ProjectComparison } from '@/types'

interface ComparadorModalProps {
  comparisons: ProjectComparison[]
  onClose: () => void
}

const EASE = [0.25, 0.1, 0.25, 1] as const

function hasHoverCapability() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover)').matches
  )
}

export default function ComparadorModal({ comparisons, onClose }: ComparadorModalProps) {
  const [mounted, setMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAfter, setShowAfter] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  const active = comparisons[activeIndex]

  function goTo(index: number) {
    setActiveIndex(index)
    setShowAfter(false)
  }

  const prev = () => goTo(Math.max(0, activeIndex - 1))
  const next = () => goTo(Math.min(comparisons.length - 1, activeIndex + 1))

  function handleMouseEnter() {
    if (hasHoverCapability()) setShowAfter(true)
  }

  function handleMouseLeave() {
    if (hasHoverCapability()) setShowAfter(false)
  }

  function handleClick() {
    if (!hasHoverCapability()) setShowAfter(v => !v)
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 bg-white w-full max-w-3xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Cerrar comparador"
          className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full text-[#666666] hover:text-[#1a1a1a] hover:bg-white shadow-sm transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div
          className="relative w-full aspect-[1080/672] bg-[#f5f5f5] select-none cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <Image
            key={`${activeIndex}-antes`}
            src={active.antesUrl}
            alt="Antes"
            fill
            className={`object-cover transition-opacity duration-300 ${
              showAfter ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 768px) 100vw, 768px"
          />
          <Image
            key={`${activeIndex}-despues`}
            src={active.despuesUrl}
            alt="Después"
            fill
            className={`object-cover transition-opacity duration-300 ${
              showAfter ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, 768px"
          />

          {/* Antes/Después label */}
          <span className="absolute top-3 left-3 bg-black/70 text-white text-[11px] uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
            {showAfter ? 'Después' : 'Antes'}
          </span>

          {/* Prev */}
          {activeIndex > 0 && (
            <button
              onClick={e => {
                e.stopPropagation()
                prev()
              }}
              aria-label="Par anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M12 5l-5 5 5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Next */}
          {activeIndex < comparisons.length - 1 && (
            <button
              onClick={e => {
                e.stopPropagation()
                next()
              }}
              aria-label="Par siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M8 5l5 5-5 5" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Dot indicator */}
          {comparisons.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {comparisons.map((_, i) => (
                <button
                  key={i}
                  onClick={e => {
                    e.stopPropagation()
                    goTo(i)
                  }}
                  aria-label={`Ir al par ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
