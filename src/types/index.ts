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

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  coverImage: ProjectImage;
  galleryImages: ProjectImage[];
  comparisons?: ProjectComparison[];
}
