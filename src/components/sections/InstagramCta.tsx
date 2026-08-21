'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE = [0.25, 0.1, 0.25, 1] as const

export default function InstagramCta() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-bg-alt">
      <div
        ref={ref}
        className="max-w-7xl mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row md:items-center md:justify-between gap-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="block text-xs uppercase tracking-widest text-text-secondary mb-3">
            Instagram
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-5xl text-[#1a1a1a] mb-4">
            Seguinos en @estudionexo_
          </h2>
          <p className="text-text-secondary text-base leading-relaxed max-w-lg">
            Arquitectura, procesos y detalles del día a día del estudio.
          </p>
        </motion.div>

        <motion.a
          href="https://www.instagram.com/estudionexo_/"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="shrink-0 inline-flex items-center gap-2 border border-[#1a1a1a] text-[#1a1a1a] text-sm font-medium tracking-widest uppercase px-8 py-3.5 rounded-full hover:bg-[#1a1a1a] hover:text-white transition-colors duration-200"
        >
          Ver Instagram
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
            <path
              d="M5 11 11 5M11 5H6M11 5v5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.a>
      </div>
    </section>
  )
}
