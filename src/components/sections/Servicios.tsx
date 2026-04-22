'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const services = [
  {
    id: 'residencial',
    title: 'Arquitectura residencial',
    description:
      'Diseñamos viviendas pensadas para la vida cotidiana. Cada proyecto parte del cliente, su forma de habitar y el contexto donde se emplaza.',
  },
  {
    id: 'interiores',
    title: 'Diseño de interiores',
    description:
      'Intervenimos espacios existentes con criterio estético y funcional. Materiales, luz y proporción al servicio de una atmósfera propia.',
  },
  {
    id: 'remodelaciones',
    title: 'Remodelaciones',
    description:
      'Transformamos lo existente para adaptarlo a nuevas necesidades. Aprovechamos el potencial oculto de cada espacio con soluciones precisas.',
  },
  {
    id: 'direccion',
    title: 'Proyecto y dirección de obra',
    description:
      'Acompañamos el proceso completo: desde la idea hasta la entrega de llaves. Coordinamos equipo, plazos y calidad con dedicación total.',
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
      className="bg-white p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <h3 className="font-heading font-semibold text-lg text-[#1a1a1a] mb-3">
        {service.title}
      </h3>
      <p className="text-text-secondary text-sm leading-relaxed">{service.description}</p>
    </motion.div>
  )
}

export default function Servicios() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="servicios"
      className="bg-bg-alt scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        {/* Section header */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="font-heading font-bold text-3xl md:text-4xl text-[#1a1a1a] text-center mb-16"
        >
          Servicios
        </motion.h2>

        {/* Cards grid */}
        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
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
