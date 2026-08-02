export type Proyecto = {
  id: string;
  categoria: string;
  categoria_id: string | null;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  orden: number;
  activo: boolean;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
