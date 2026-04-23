'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const FADE_UP = { opacity: 0, y: 20 }
const FADE_IN = { opacity: 1, y: 0 }

function fadeTransition(delay: number) {
  return { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const, delay }
}

export default function Hero() {
  return (
    <section id="hero" className="relative h-screen w-full flex items-center">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
        alt="Interior de arquitectura"
        fill
        priority
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-6">
        <motion.h1
          initial={FADE_UP}
          animate={FADE_IN}
          transition={fadeTransition(0)}
          className="font-helvetica font-bold text-white text-5xl md:text-6xl lg:text-7xl leading-tight mb-4"
        >
          Arquitectura
          <br />
          <span className="text-white/90">& Diseño de interiores</span>
        </motion.h1>

        <motion.p
          initial={FADE_UP}
          animate={FADE_IN}
          transition={fadeTransition(0.2)}
          className="text-white/80 text-lg mb-8 max-w-xl leading-relaxed"
        >
          Transformamos espacios en experiencias.
          <br />
          Diseñamos, planificamos y ejecutamos cada detalle.
        </motion.p>

        <motion.a
          initial={FADE_UP}
          animate={FADE_IN}
          transition={fadeTransition(0.4)}
          href="#trabajos"
          className="inline-block bg-white text-[#1a1a1a] px-8 py-3 rounded-full text-sm font-medium tracking-wide hover:bg-white/90 transition-colors duration-200"
        >
          Conocé nuestros trabajos
        </motion.a>
      </div>
    </section>
  )
}
