export interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  coverImage: ProjectImage;
  galleryImages: ProjectImage[];
}
