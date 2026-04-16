const navLinks = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Trabajos', href: '#trabajos' },
  { label: 'Nosotras', href: '#nosotras' },
  { label: 'Contacto', href: '#contacto' },
]

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.641 1.267 1.408 0 .858-.546 2.141-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.867 3.137-4.563 0-2.386-1.716-4.054-4.164-4.054-2.838 0-4.502 2.129-4.502 4.332 0 .858.33 1.776.742 2.279a.3.3 0 0 1 .069.286c-.076.315-.244.995-.277 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-3">
            <a
              href="#hero"
              className="font-heading font-bold text-xl tracking-widest hover:opacity-70 transition-opacity"
            >
              NEXO
            </a>
            <p className="text-sm text-white/50 max-w-50 leading-relaxed">
              Arquitectura & Diseño de interiores. Córdoba, Argentina.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-3" aria-label="Footer navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200 w-fit"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/estudionexo_"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Nexo Estudio"
              className="text-white/60 hover:text-white transition-colors duration-200"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://wa.me/5493512540654"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de Nexo Estudio"
              className="text-white/60 hover:text-white transition-colors duration-200"
            >
              <WhatsAppIcon />
            </a>
            <a
              href="https://ar.pinterest.com/estudionexoarquitectura/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest de Nexo Estudio"
              className="text-white/60 hover:text-white transition-colors duration-200"
            >
              <PinterestIcon />
            </a>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-xs text-white/30 tracking-wide">
            © 2026 Nexo Estudio. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
