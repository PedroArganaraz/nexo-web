import type { Service, Project } from "@/types";

export const services: Service[] = [];

export const projects: Project[] = [
  {
    id: "chacabuco",
    title: "Chacabuco",
    category: "Remodelación",
    description:
      "Intervención integral de un departamento de los años 80 en el barrio Chacabuco. Se reorganizó la planta para ganar amplitud en los espacios sociales, incorporando materialidad contemporánea que dialoga con la preexistencia.",
    coverImage: {
      src: "/images/projects/chacabuco.jpg",
      alt: "Cocina remodelada Chacabuco",
    },
    galleryImages: [
      {
        src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
        alt: "Cocina remodelada Chacabuco",
      },
      {
        src: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=80",
        alt: "Comedor remodelado Chacabuco",
      },
      {
        src: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&q=80",
        alt: "Living remodelado Chacabuco",
      },
    ],
  },
  {
    id: "bano-milano",
    title: "Baño Milano",
    category: "Diseño de interiores",
    description:
      "Diseño de un baño principal en un edificio de Nueva Córdoba. Se buscó una atmósfera spa con terminaciones en microcemento, griferías mate y luz cálida indirecta. El resultado: un espacio pequeño que se siente generoso.",
    coverImage: {
      src: "/images/projects/bano-milano.jpg",
      alt: "Baño Milano diseño de interiores",
    },
    galleryImages: [
      {
        src: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
        alt: "Baño Milano - vista principal",
      },
      {
        src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
        alt: "Baño Milano - detalle ducha",
      },
      {
        src: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80",
        alt: "Baño Milano - vanitory",
      },
    ],
  },
  {
    id: "casa-tanti",
    title: "Casa Tanti",
    category: "Arquitectura residencial",
    description:
      "Vivienda unifamiliar en las sierras de Córdoba. El proyecto responde al paisaje mediante volúmenes que se abren hacia el verde y materiales que envejecen con dignidad: hormigón, madera y vidrio.",
    coverImage: {
      src: "/images/projects/casa-daniel.jpg",
      alt: "Casa Tanti exterior",
    },
    galleryImages: [
      {
        src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        alt: "Casa Tanti - fachada",
      },
      {
        src: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=1200&q=80",
        alt: "Casa Tanti - living",
      },
      {
        src: "https://images.unsplash.com/photo-1615873968403-89e068629265?w=1200&q=80",
        alt: "Casa Tanti - comedor",
      },
    ],
  },
  {
    id: "casa-calina",
    title: "Casa Calina",
    category: "Obra nueva",
    description:
      "Obra nueva en barrio privado de Alta Gracia. Programa de 240 m² distribuidos en planta baja y primer piso, con foco en la relación entre los espacios interiores y el jardín. Dirección de obra a cargo de Nexo.",
    coverImage: {
      src: "/images/projects/casa-calina.jpg",
      alt: "Casa Calina fachada",
    },
    galleryImages: [
      {
        src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
        alt: "Casa Calina - fachada",
      },
      {
        src: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80",
        alt: "Casa Calina - exterior noche",
      },
      {
        src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
        alt: "Casa Calina - piscina",
      },
    ],
  },
  {
    id: "potrero",
    title: "Potrero",
    category: "Arquitectura residencial",
    description:
      "Casa de fin de semana en Valle de Punilla. El encargo fue claro: mínima huella, máxima integración. Una volumetría lineal que se asienta sobre el terreno sin imponerse, con techos que recogen el agua de lluvia.",
    coverImage: {
      src: "/images/projects/potrero.jpg",
      alt: "Casa Potrero exterior",
    },
    galleryImages: [
      {
        src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
        alt: "Potrero - exterior",
      },
      {
        src: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
        alt: "Potrero - entorno",
      },
      {
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        alt: "Potrero - interior",
      },
    ],
  },
  {
    id: "depto-nueva-cordoba",
    title: "Depto Nueva Córdoba",
    category: "Diseño de interiores",
    description:
      "Puesta en valor de un departamento de 60 m² para alquiler temporario. Se priorizó la funcionalidad sin resignar estética: mobiliario a medida, paleta neutra y textiles cálidos que generan pertenencia desde el primer día.",
    coverImage: {
      src: "/images/projects/depto-nueva-cba.jpg",
      alt: "Depto Nueva Córdoba living",
    },
    galleryImages: [
      {
        src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
        alt: "Depto Nueva Córdoba - living",
      },
      {
        src: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80",
        alt: "Depto Nueva Córdoba - cocina",
      },
      {
        src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
        alt: "Depto Nueva Córdoba - dormitorio",
      },
    ],
  },
];
