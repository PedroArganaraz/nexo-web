'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE = [0.25, 0.1, 0.25, 1] as const

const paragraphs = [
  'NEXO nace de la idea de conectar. Conectar espacios con quienes los habitan, ideas con ejecución y diseño con funcionalidad.',
  'Somos un estudio de arquitectura e interiorismo que aborda cada proyecto de manera integral, desde la idea inicial hasta su materialización.',
  'Trabajamos a partir de un proceso claro: diseñar, planificar y acompañar cada decisión para lograr resultados funcionales, coherentes y bien resueltos, adaptados a las necesidades de cada cliente.',
  'Creemos en un diseño pensado, en la importancia del detalle y en estar presentes durante toda la obra.',
  'No se trata solo de cómo se ve un espacio, sino de cómo funciona y se vive.',
]

export default function SobreElEstudio() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-white">
      <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-helvetica font-bold text-3xl md:text-4xl text-[#1a1a1a] mb-10"
        >
          Sobre Nexo
        </motion.h2>

        <div className="flex flex-col gap-5">
          {paragraphs.map((text, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 + i * 0.08 }}
              className="text-[#1a1a1a] text-base md:text-lg leading-relaxed"
            >
              {text}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  )
}
