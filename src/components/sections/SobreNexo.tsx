'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const EASE = [0.25, 0.1, 0.25, 1] as const

export default function SobreNexo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="nosotras" className="scroll-mt-20">
      {/* Title */}
      <div className="bg-white px-6 md:px-16 pt-16 pb-4">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-heading font-bold text-3xl md:text-4xl text-[#1a1a1a]"
        >
          Sobre Nosotras
        </motion.h2>
      </div>

      {/* Full-width image */}
      <div className="relative w-full" style={{ height: '85vh' }}>
      <Image
        src="/images/equipo.png"
        alt="Alma, Cami y Lu — Nexo Estudio"
        fill
        className="object-cover object-[65%_center]"
        sizes="100vw"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Top text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="absolute top-10 md:top-14 left-0 right-0 px-6 md:px-16 max-w-3xl"
      >
        <p className="font-helvetica text-white text-lg md:text-xl leading-relaxed">
          Somos Alma, Cami y Lu. Amigas y arquitectas.
        </p>
        <p className="font-helvetica text-white/85 text-base md:text-lg leading-relaxed mt-4">
          Juntas formamos Nexo, un espacio que nace de nuestras ganas de hacer lo que nos apasiona.
          Nos conocimos en la facultad y hoy seguimos eligiendo trabajar juntas, impulsadas por la
          sensibilidad, la escucha y el diseño como forma de expresión.
        </p>
      </motion.div>

      {/* Bottom text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        className="absolute bottom-10 md:bottom-14 left-0 right-0 px-6 md:px-16"
      >
        <p className="font-helvetica text-white text-base md:text-lg leading-relaxed">
          El resultado final es solo una parte. Diseñamos todo lo que lo hace posible.
        </p>
      </motion.div>
      </div>
    </section>
  )
}
