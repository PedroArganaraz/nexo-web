'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE = [0.25, 0.1, 0.25, 1] as const

const steps = [
  {
    number: '01',
    title: 'Escuchamos',
    description: 'Entendemos el espacio, las necesidades y la forma de habitar.',
    barColor: '#B4B2A9',
  },
  {
    number: '02',
    title: 'Diseñamos',
    description: 'Proyectamos cada decisión con criterio estético y funcional.',
    barColor: '#888780',
  },
  {
    number: '03',
    title: 'Planificamos',
    description: 'Bajamos el diseño a planos, medidas y definiciones técnicas.',
    barColor: '#5F5E5A',
  },
  {
    number: '04',
    title: 'Ejecutamos',
    description: 'Acompañamos la obra, coordinamos y resolvemos en tiempo real.',
    barColor: '#2C2C2A',
  },
]

export default function Proceso() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-[#EBEBEB] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-helvetica font-bold text-3xl md:text-4xl text-[#1a1a1a] mb-10"
        >
          Proceso
        </motion.h2>

        {/* Desktop */}
        <div className="hidden md:flex">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.1 }}
              className={`flex-1 bg-white flex flex-col ${
                i < steps.length - 1 ? 'border-r border-r-[#d0d0d0]' : ''
              }`}
              style={{ borderRightWidth: i < steps.length - 1 ? '0.5px' : undefined }}
            >
              <div className="h-[3px] w-full" style={{ backgroundColor: step.barColor }} />
              <div className="p-5">
                <span className="block text-[11px] text-[#aaaaaa] mb-3 font-mono">
                  {step.number}
                </span>
                <h3 className="font-medium text-[15px] text-[#1a1a1a] mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[12px] text-[#888888] leading-[1.4]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: 2×2 grid */}
        <div className="grid grid-cols-2 md:hidden">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 + i * 0.1 }}
              className={`bg-white flex flex-col ${i % 2 === 0 ? 'border-r border-r-[#d0d0d0]' : ''} ${
                i < 2 ? 'border-b border-b-[#d0d0d0]' : ''
              }`}
              style={{
                borderRightWidth: i % 2 === 0 ? '0.5px' : undefined,
                borderBottomWidth: i < 2 ? '0.5px' : undefined,
              }}
            >
              <div className="h-[3px] w-full" style={{ backgroundColor: step.barColor }} />
              <div className="p-4">
                <span className="block text-[11px] text-[#aaaaaa] mb-2 font-mono">
                  {step.number}
                </span>
                <h3 className="font-medium text-[14px] text-[#1a1a1a] mb-1.5 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[11px] text-[#888888] leading-[1.4]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
