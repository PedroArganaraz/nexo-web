'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { urlVariante, type Variante } from '@/lib/imagenes'

type ImagenVarianteProps = Omit<ImageProps, 'src'> & {
  src: string
  variante: Variante
}

export default function ImagenVariante({
  src,
  alt,
  variante,
  onError,
  ...props
}: ImagenVarianteProps) {
  const preferida = urlVariante(src, variante)
  const [fallida, setFallida] = useState<string | null>(null)
  const actual = fallida === preferida ? src : preferida

  return (
    <Image
      {...props}
      src={actual}
      alt={alt}
      onError={(e) => {
        if (actual === preferida && preferida !== src) {
          setFallida(preferida)
          return
        }
        onError?.(e)
      }}
    />
  )
}
