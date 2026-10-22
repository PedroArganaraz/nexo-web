export type ProyectoEstado =
  | "proyecto"
  | "en_obra"
  | "ejecutado"
  | "sin_estado";

export type Proyecto = {
  id: string;
  categoria: string;
  categoria_id: string | null;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  orden: number;
  activo: boolean;
  estado: ProyectoEstado;
  anio: number | null;
  created_at: string;
  updated_at: string;
};

export type Categoria = {
  id: string;
  nombre: string;
  created_at: string;
};

export type ProyectoImagen = {
  id: string;
  proyecto_id: string;
  url: string;
  path: string;
  orden: number;
  es_portada: boolean;
  focal_x: number;
  focal_y: number;
  created_at: string;
};

export type ProyectoComparacion = {
  id: string;
  proyecto_id: string;
  antes_url: string;
  antes_path: string;
  despues_url: string;
  despues_path: string;
  orden: number;
  created_at: string;
};

export type Nota = {
  id: string;
  titulo: string;
  descripcion: string;
  created_at: string;
  updated_at: string;
};

export type SitioConfig = {
  id: string;
  hero_url: string | null;
  hero_path: string | null;
  hero_focal_x: number;
  hero_focal_y: number;
  hero_mobile_focal_x: number;
  hero_mobile_focal_y: number;
  hero_zoom: number;
  hero_mobile_zoom: number;
  updated_at: string;
};

export type ObjetoCategoria = {
  id: string;
  nombre: string;
  slug: string;
  imagen_url: string | null;
  imagen_path: string | null;
  focal_x: number;
  focal_y: number;
  orden: number;
  activo: boolean;
  created_at: string;
};

export type ObjetoSubcategoria = {
  id: string;
  categoria_id: string;
  nombre: string;
  orden: number;
  created_at: string;
};

export type Objeto = {
  id: string;
  categoria_id: string;
  subcategoria_id: string | null;
  nombre: string;
  descripcion: string;
  precio: number | null;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ObjetoImagen = {
  id: string;
  objeto_id: string;
  url: string;
  path: string;
  orden: number;
  es_portada: boolean;
  focal_x: number;
  focal_y: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      proyectos: {
        Row: Proyecto;
        Insert: Partial<Omit<Proyecto, "created_at" | "updated_at">> &
          Pick<Proyecto, "nombre" | "subtitulo" | "descripcion">;
        Update: Partial<Omit<Proyecto, "id" | "created_at" | "updated_at">>;
        Relationships: [
          {
            foreignKeyName: "proyectos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          }
        ];
      };
      proyecto_imagenes: {
        Row: ProyectoImagen;
        Insert: Partial<Omit<ProyectoImagen, "id" | "created_at">> &
          Pick<ProyectoImagen, "proyecto_id" | "url" | "path">;
        Update: Partial<Omit<ProyectoImagen, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "proyecto_imagenes_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          }
        ];
      };
      categorias: {
        Row: Categoria;
        Insert: Partial<Omit<Categoria, "id" | "created_at">> &
          Pick<Categoria, "nombre">;
        Update: Partial<Omit<Categoria, "id" | "created_at">>;
        Relationships: [];
      };
      proyecto_comparaciones: {
        Row: ProyectoComparacion;
        Insert: Partial<Omit<ProyectoComparacion, "id" | "created_at">> &
          Pick<
            ProyectoComparacion,
            "proyecto_id" | "antes_url" | "antes_path" | "despues_url" | "despues_path"
          >;
        Update: Partial<Omit<ProyectoComparacion, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "proyecto_comparaciones_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          }
        ];
      };
      notas: {
        Row: Nota;
        Insert: Partial<Omit<Nota, "id" | "created_at" | "updated_at">> &
          Pick<Nota, "titulo">;
        Update: Partial<Omit<Nota, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      sitio_config: {
        Row: SitioConfig;
        // Fila única fija (id='default'): el upsert siempre especifica el id.
        Insert: Partial<SitioConfig> & Pick<SitioConfig, "id">;
        Update: Partial<Omit<SitioConfig, "id">>;
        Relationships: [];
      };
      objeto_categorias: {
        Row: ObjetoCategoria;
        Insert: Partial<Omit<ObjetoCategoria, "id" | "created_at">> &
          Pick<ObjetoCategoria, "nombre" | "slug">;
        Update: Partial<Omit<ObjetoCategoria, "id" | "created_at">>;
        Relationships: [];
      };
      objetos: {
        Row: Objeto;
        Insert: Partial<Omit<Objeto, "created_at" | "updated_at">> &
          Pick<Objeto, "categoria_id" | "nombre" | "descripcion">;
        Update: Partial<Omit<Objeto, "id" | "created_at" | "updated_at">>;
        Relationships: [
          {
            foreignKeyName: "objetos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "objeto_categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "objetos_subcategoria_id_fkey";
            columns: ["subcategoria_id"];
            isOneToOne: false;
            referencedRelation: "objeto_subcategorias";
            referencedColumns: ["id"];
          }
        ];
      };
      objeto_subcategorias: {
        Row: ObjetoSubcategoria;
        Insert: Partial<Omit<ObjetoSubcategoria, "id" | "created_at">> &
          Pick<ObjetoSubcategoria, "categoria_id" | "nombre">;
        Update: Partial<Omit<ObjetoSubcategoria, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "objeto_subcategorias_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "objeto_categorias";
            referencedColumns: ["id"];
          }
        ];
      };
      objeto_imagenes: {
        Row: ObjetoImagen;
        Insert: Partial<Omit<ObjetoImagen, "id" | "created_at">> &
          Pick<ObjetoImagen, "objeto_id" | "url" | "path">;
        Update: Partial<Omit<ObjetoImagen, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "objeto_imagenes_objeto_id_fkey";
            columns: ["objeto_id"];
            isOneToOne: false;
            referencedRelation: "objetos";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
