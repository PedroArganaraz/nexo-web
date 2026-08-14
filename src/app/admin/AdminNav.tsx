"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/proyectos", label: "Proyectos" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/notas", label: "Notas" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      {links.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors duration-200 ${
              isActive
                ? "text-[#1a1a1a] font-semibold"
                : "text-text-secondary hover:text-[#1a1a1a]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
