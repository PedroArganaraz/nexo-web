"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/objects/categorias", label: "Categorías" },
  { href: "/admin/objects/productos", label: "Productos" },
];

export default function ObjectsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-10 items-center rounded-full border px-5 text-sm font-medium tracking-wide transition-colors duration-200 ${
              isActive
                ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                : "bg-white border-[#e0e0e0] text-[#1a1a1a] hover:border-[#1a1a1a]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
