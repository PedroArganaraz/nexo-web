'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Trabajos', href: '#trabajos' },
  { label: 'Nosotras', href: '#nosotras' },
  { label: 'Contacto', href: '#contacto' },
]

// `solid`: para páginas sin hero oscuro. El navbar se ve siempre como "scrolled".
export default function Navbar({ solid = false }: { solid?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isHome = usePathname() === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  // Las anclas solo existen en la home; desde otras páginas apuntan a "/#..."
  const anchorHref = (href: string) => (isHome ? href : `/${href}`)

  function handleMobileNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setIsMobileMenuOpen(false)
    // Fuera de la home dejamos que el link navegue normalmente
    if (!isHome) return
    e.preventDefault()
    // Wait for the close animation (250ms) before scrolling
    setTimeout(() => {
      const el = document.getElementById(href.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 300)
  }

  const isSolid = solid || isScrolled
  const textColor = isSolid ? 'text-[#1a1a1a]' : 'text-white'
  const barColor = isSolid ? 'bg-[#1a1a1a]' : 'bg-white'
  const objectsBtnVariant = isSolid ? 'objects-btn--dark' : 'objects-btn--light'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSolid ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <a href={anchorHref('#hero')} className="flex items-center shrink-0">
          <Image
            src="/images/NEXO_transparent.png"
            alt="Nexo Estudio"
            width={120}
            height={40}
            priority
            className={`h-8 w-auto transition-all duration-300 ${
              isSolid ? '' : 'invert'
            }`}
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/objects"
            className={`objects-btn ${objectsBtnVariant} inline-flex px-5 py-2 text-sm`}
          >
            Nexo Objects
          </Link>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={anchorHref(link.href)}
              className={`text-sm tracking-wide transition-colors duration-300 hover:opacity-60 ${textColor}`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/admin/login"
            aria-label="Acceso administrador"
            className={`transition-colors duration-300 hover:opacity-60 ${textColor}`}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <circle
                cx="10"
                cy="6.5"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </a>
        </nav>

        {/* Mobile: botón Nexo Objects + hamburguesa */}
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/objects"
            onClick={closeMobileMenu}
            className={`objects-btn ${objectsBtnVariant} inline-flex min-h-10 px-4 py-1.5 text-xs`}
          >
            Nexo Objects
          </Link>

          <button
            className="flex flex-col justify-center items-center w-10 h-10 -mr-2 gap-1.5"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span
              className={`block h-px w-6 transition-all duration-300 ${barColor} ${
                isMobileMenuOpen ? 'rotate-45 translate-y-1.75' : ''
              }`}
            />
            <span
              className={`block h-px w-6 transition-all duration-300 ${barColor} ${
                isMobileMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-px w-6 transition-all duration-300 ${barColor} ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-1.75' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-100"
          >
            <nav className="flex flex-col px-6 py-4">
              {navLinks.map((link, i) => (
                <a
                  key={link.href}
                  href={anchorHref(link.href)}
                  onClick={(e) => handleMobileNavClick(e, link.href)}
                  className={`text-[#1a1a1a] text-base py-3 tracking-wide transition-colors hover:text-text-secondary ${
                    i < navLinks.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
