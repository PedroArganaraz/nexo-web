'use client'

import { useRef, useState, type FormEvent } from 'react'
import { motion, useInView } from 'framer-motion'

const WA_NUMBER = '5493512540654'

const EASE = [0.25, 0.1, 0.25, 1] as const

const contactItems = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    value: '+54 9 3512 54-0654',
    href: 'https://wa.me/5493512540654',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    value: '@estudionexo_',
    href: 'https://instagram.com/estudionexo_',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    value: 'estudionexoarquitectura',
    href: 'https://ar.pinterest.com/estudionexoarquitectura/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path
          d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.641 1.267 1.408 0 .858-.546 2.141-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.867 3.137-4.563 0-2.386-1.716-4.054-4.164-4.054-2.838 0-4.502 2.129-4.502 4.332 0 .858.33 1.776.742 2.279a.3.3 0 0 1 .069.286c-.076.315-.244.995-.277 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"
          stroke="currentColor"
          strokeWidth="0"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    value: 'estudionexo.arquitectura@gmail.com',
    href: 'mailto:estudionexo.arquitectura@gmail.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    value: 'Córdoba, Argentina',
    href: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" aria-hidden="true">
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

const inputClass =
  'w-full bg-white border border-[#e0e0e0] rounded-sm px-4 py-3 text-sm text-[#1a1a1a] placeholder-[#aaaaaa] outline-none focus:border-[#1a1a1a] transition-colors duration-200'

export default function Contacto() {
  const ref = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const nombre = (data.get('nombre') as string).trim()
    const email = (data.get('email') as string).trim()
    const mensaje = (data.get('mensaje') as string).trim()

    const parts = [`Hola, soy ${nombre}.`]
    if (email) parts.push(`Mi email es ${email}.`)
    parts.push(mensaje)

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(parts.join(' '))}`
    window.open(url, '_blank', 'noopener,noreferrer')

    setSent(true)
    formRef.current?.reset()
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <section id="contacto" className="bg-bg-alt scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <motion.h2
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-heading font-bold text-3xl md:text-4xl text-[#1a1a1a] text-center mb-16"
        >
          Contacto
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {/* Form */}
          <motion.form
            ref={formRef}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              required
              className={inputClass}
            />
            <input
              type="email"
              name="email"
              placeholder="Email (opcional)"
              className={inputClass}
            />
            <textarea
              name="mensaje"
              placeholder="Contanos sobre tu proyecto..."
              required
              rows={5}
              className={`${inputClass} resize-none`}
            />
            <div className="mt-2 flex items-center gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#1a1a1a] text-white text-sm font-medium tracking-wide px-8 py-3 rounded-full hover:bg-accent transition-colors duration-200"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path
                    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Enviar por WhatsApp
              </button>
              {sent && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-text-secondary"
                >
                  ¡Redirigiendo a WhatsApp!
                </motion.span>
              )}
            </div>
          </motion.form>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="flex flex-col gap-6 md:pt-1"
          >
            {contactItems.map((item) => (
              <div key={item.id} className="flex items-start gap-4 text-[#1a1a1a]">
                <span className="mt-0.5 text-text-secondary">{item.icon}</span>
                <div>
                  <p className="text-xs tracking-widest uppercase text-text-secondary mb-0.5">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#1a1a1a] hover:text-text-secondary transition-colors duration-200"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm text-[#1a1a1a]">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
