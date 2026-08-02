export type Proyecto = {
  id: string;
  categoria: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  orden: number;
  created_at: string;
  updated_at: string;
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

export type Database = {
  public: {
    Tables: {
      proyectos: {
        Row: Proyecto;
        Insert: Partial<Omit<Proyecto, "created_at" | "updated_at">> &
          Pick<Proyecto, "categoria" | "nombre" | "subtitulo" | "descripcion">;
        Update: Partial<Omit<Proyecto, "id" | "created_at" | "updated_at">>;
        Relationships: [];
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
