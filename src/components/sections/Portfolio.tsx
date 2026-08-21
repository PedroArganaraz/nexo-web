'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import type { Project, ProjectStage } from '@/types'
import Lightbox from '@/components/ui/Lightbox'

const EASE = [0.25, 0.1, 0.25, 1] as const

const STAGE_LABELS: Record<ProjectStage, string> = {
  proyecto: 'Proyecto',
  en_obra: 'En obra',
  ejecutado: 'Ejecutado',
  sin_estado: 'Sin estado',
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3" aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function LampIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3" aria-hidden="true">
      <path
        d="M10 2.5a5.5 5.5 0 0 0-3 10.1c.6.4 1 1.05 1 1.75V15h4v-.65c0-.7.4-1.35 1-1.75A5.5 5.5 0 0 0 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8.5 17h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function HammerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3" aria-hidden="true">
      <rect
        x="9.5"
        y="2.5"
        width="8"
        height="4"
        rx="0.8"
        transform="rotate(45 13.5 4.5)"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M10.5 7.5 4 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6.5 10.2l2.3 2.3 4.7-4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StageIcon({ stage }: { stage: ProjectStage }) {
  if (stage === 'en_obra') return <HammerIcon />
  if (stage === 'ejecutado') return <CheckIcon />
  return <LampIcon />
}

function ProjectCard({
  project,
  index,
  inView,
  onClick,
}: {
  project: Project
  index: number
  inView: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.1 }}
      onClick={onClick}
      className="group relative w-full overflow-hidden aspect-[4/3] cursor-pointer text-left bg-[#f5f5f5]"
      aria-label={`Ver proyecto ${project.title}`}
    >
      <Image
        src={project.coverImage.src}
        alt={project.coverImage.alt}
        fill
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        style={{
          objectPosition: `${project.coverImage.focalX ?? 50}% ${
            project.coverImage.focalY ?? 50
          }%`,
        }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Gradient overlay — siempre visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:opacity-80" />

      {/* Año — esquina superior izquierda, solo si está cargado */}
      {project.year && (
        <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">
          <CalendarIcon />
          {project.year}
        </span>
      )}

      {/* Etapa — esquina inferior derecha, oculto si es "sin_estado" */}
      {project.stage !== 'sin_estado' && (
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full">
          <StageIcon stage={project.stage} />
          {STAGE_LABELS[project.stage]}
        </span>
      )}

      {/* Caption — siempre visible */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <span className="block text-xs tracking-widest uppercase text-white/70 mb-1">
          {project.category}
        </span>
        <span className="block font-helvetica font-semibold text-white text-base md:text-lg leading-snug uppercase tracking-wide">
          {project.title}
        </span>
        <span className="block text-[11px] text-white/60 uppercase tracking-widest mt-0.5">
          {project.subtitle}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 text-white/60 text-xs tracking-wide">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6 8h4M8 6l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver proyecto
        </span>
      </div>
    </motion.button>
  )
}

export default function Portfolio({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  return (
    <>
      <section id="trabajos" className="bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <motion.h2
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-helvetica font-bold text-3xl md:text-4xl text-[#1a1a1a] text-center mb-16"
          >
            Algunos proyectos
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                inView={inView}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedProject && (
          <Lightbox
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
