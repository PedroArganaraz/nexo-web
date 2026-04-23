'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { projects } from '@/lib/data'
import type { Project } from '@/types'
import Lightbox from '@/components/ui/Lightbox'

const EASE = [0.25, 0.1, 0.25, 1] as const

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
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Gradient overlay — siempre visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:opacity-80" />

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

export default function Portfolio() {
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
            className="font-heading font-bold text-3xl md:text-4xl text-[#1a1a1a] text-center mb-16"
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
