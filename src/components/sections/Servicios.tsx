'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const services = [
  {
    id: 'residencial',
    title: 'Proyecto arquitectónico',
    description:
      'Diseñamos desde cero, adaptando cada proyecto al uso, el contexto y las necesidades del cliente. Definimos distribución, materialidad y funcionamiento desde una mirada integral.',
  },
  {
    id: 'interiores',
    title: 'Diseño de interiores',
    description:
      'Transformamos espacios existentes a través del diseño y la planificación. Trabajamos con materiales, iluminación y mobiliario para lograr ambientes coherentes y funcionales.',
  },
  {
    id: 'remodelaciones',
    title: 'Remodelaciones',
    description:
      'Reconfiguramos espacios para adaptarlos a nuevas necesidades. Detectamos oportunidades y resolvemos cada intervención con decisiones precisas.',
  },
  {
    id: 'direccion',
    title: 'Dirección de obra',
    description:
      'Desarrollamos el proyecto completo y acompañamos su ejecución. Coordinamos obra, resolvemos en el proceso y aseguramos que cada decisión se materialice correctamente.',
  },
]

function ServiceCard({
  service,
  index,
  inView,
}: {
  service: (typeof services)[0]
  index: number
  inView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const, delay: index * 0.12 }}
      className="bg-[#2e2e2d] p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <h3 className="font-helvetica font-semibold text-lg text-white mb-3">
        {service.title}
      </h3>
      <p className="text-white/60 text-sm leading-relaxed">
        {service.description}
      </p>
    </motion.div>
  )
}

export default function Servicios() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="servicios"
      className="bg-[#1a1a1a] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* Section header */}
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="font-helvetica font-bold text-3xl md:text-4xl text-white mb-6"
        >
          Servicios
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.1 }}
          className="text-white/60 text-base leading-relaxed max-w-4xl mb-16"
        >
          Nos importa tanto el proceso como el resultado.
          <br />
          <span className="md:whitespace-nowrap">
            Cada proyecto se desarrolla a partir de decisiones concretas que
            conectan diseño, técnica y ejecución.
          </span>
        </motion.p>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
