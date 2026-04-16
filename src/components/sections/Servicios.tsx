'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const services = [
  {
    id: 'residencial',
    title: 'Arquitectura residencial',
    description:
      'Diseñamos viviendas pensadas para la vida cotidiana. Cada proyecto parte del cliente, su forma de habitar y el contexto donde se emplaza.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9" aria-hidden="true">
        <path
          d="M6 18L20 6l14 12v16H26v-9h-12v9H6V18z"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'interiores',
    title: 'Diseño de interiores',
    description:
      'Intervenimos espacios existentes con criterio estético y funcional. Materiales, luz y proporción al servicio de una atmósfera propia.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9" aria-hidden="true">
        <rect x="6" y="10" width="28" height="20" rx="1" stroke="#1a1a1a" strokeWidth="1.5" />
        <path d="M6 18h28" stroke="#1a1a1a" strokeWidth="1.5" />
        <path d="M16 10v8" stroke="#1a1a1a" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'remodelaciones',
    title: 'Remodelaciones',
    description:
      'Transformamos lo existente para adaptarlo a nuevas necesidades. Aprovechamos el potencial oculto de cada espacio con soluciones precisas.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9" aria-hidden="true">
        <path d="M10 30L30 10" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M24 10l6 6-14 14H10v-6L24 10z"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'direccion',
    title: 'Proyecto y dirección de obra',
    description:
      'Acompañamos el proceso completo: desde la idea hasta la entrega de llaves. Coordinamos equipo, plazos y calidad con dedicación total.',
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9" aria-hidden="true">
        <rect x="8" y="14" width="24" height="18" rx="1" stroke="#1a1a1a" strokeWidth="1.5" />
        <path d="M14 14v-4a6 6 0 0 1 12 0v4" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="23" r="2.5" stroke="#1a1a1a" strokeWidth="1.5" />
      </svg>
    ),
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
      <div className="mb-5">{service.icon}</div>
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
