export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
  focalX?: number;
  focalY?: number;
}

export interface ProjectComparison {
  antesUrl: string;
  despuesUrl: string;
}

export type ProjectStage = "proyecto" | "en_obra" | "ejecutado" | "sin_estado";

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  coverImage: ProjectImage;
  galleryImages: ProjectImage[];
  comparisons?: ProjectComparison[];
  stage: ProjectStage;
  year?: number;
}

export interface ObjectCategory {
  id: string;
  name: string;
  slug: string;
  image: ProjectImage | null;
}

export interface NexoObject {
  id: string;
  name: string;
  description: string;
  price: number | null;
  coverImage: ProjectImage;
  galleryImages: ProjectImage[];
}

export interface ObjectCategoryDetail extends ObjectCategory {
  objects: NexoObject[];
}
