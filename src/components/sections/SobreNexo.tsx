'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const EASE = [0.25, 0.1, 0.25, 1] as const

export default function SobreNexo() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="nosotras" className="bg-white scroll-mt-20">
      <div
        ref={ref}
        className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col md:flex-row gap-12 md:gap-20 items-center"
      >
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="w-full md:w-1/2 shrink-0"
        >
          <div className="relative aspect-4/3 w-full overflow-hidden">
            <Image
              src="/images/equipo.jpg"
              alt="Equipo de Nexo trabajando"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          className="w-full md:w-1/2"
        >
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-[#1a1a1a] mb-8">
            Sobre Nosotras
          </h2>

          <div className="space-y-5 text-text-secondary text-base leading-relaxed">
            <p>Somos Alma, Cami y Lu. Amigas y arquitectas.</p>
            <p>
              Juntas formamos Nexo, un espacio que nace de nuestras ganas de hacer lo que nos
              apasiona: proyectar, transformar y habitar con intención.
            </p>
            <p>
              Nos conocimos en la facultad y hoy seguimos eligiendo trabajar juntas, impulsadas
              por la sensibilidad, la escucha y el diseño como forma de expresión.
            </p>
            <p>
              Creemos que los espacios cuentan historias, y que pueden ser reflejo de quienes
              los habitan. Por eso, en Nexo diseñamos con identidad, buscando siempre que cada
              proyecto acompañe, emocione e inspire.
            </p>
            <p>
              Nos dedicamos a la arquitectura interior, remodelaciones, diseño técnico y
              comunicación visual. Trabajamos con clientes particulares, marcas y
              emprendimientos, creando propuestas a medida con una estética cálida, versátil y
              contemporánea.
            </p>
            <p>
              Cada proyecto es una oportunidad para conectar, imaginar y construir algo nuevo.
            </p>
            <p>Bienvenidos a Nexo.</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
