'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'

const navLinks = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Trabajos', href: '#trabajos' },
  { label: 'Nosotras', href: '#nosotras' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  function handleMobileNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    // Wait for the close animation (250ms) before scrolling
    setTimeout(() => {
      const el = document.getElementById(href.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 300)
  }

  const textColor = isScrolled ? 'text-[#1a1a1a]' : 'text-white'
  const barColor = isScrolled ? 'bg-[#1a1a1a]' : 'bg-white'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center">
          <Image
            src="/images/NEXO_transparent.png"
            alt="Nexo Estudio"
            width={120}
            height={40}
            priority
            className={`h-8 w-auto transition-all duration-300 ${
              isScrolled ? '' : 'invert'
            }`}
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition-colors duration-300 hover:opacity-60 ${textColor}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Hamburger button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
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
                  href={link.href}
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
