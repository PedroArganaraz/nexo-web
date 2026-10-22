# Reglas generales del proyecto

Estas reglas aplican a todo el trabajo en este repositorio, en cada paso y sin que haga falta repetirlas en los prompts.

## Reglas de trabajo

- **Responsive siempre.** Todo se construye mobile-first y tiene que verse y funcionar bien en mobile y desktop (`md:` para desktop). Antes de dar un paso por terminado, revisar a 375px, 768px y 1280px: sin scroll horizontal, sin textos cortados ni solapamientos, y con áreas táctiles de al menos 40-44px. Esto incluye el panel de admin, que se usa también desde el celular.
- **Sin comentarios.** No dejar comentarios en el código: ni `//`, ni `/* */`, ni `{/* */}` en JSX, ni en CSS, ni en SQL. Los comentarios que ya existen en archivos que no se están tocando no se modifican.
- **Next.js 16.2.4.** Antes de usar APIs de Next, leer la guía correspondiente en `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- **Verificación.** Al terminar cada paso, correr `npx tsc --noEmit` y `npx eslint` sobre los archivos tocados.
- **Alcance.** Hacer solo lo que pide el paso actual. Si se detecta algo roto fuera del alcance, avisarlo al final en vez de arreglarlo sin que se pida.
- **Cierre de cada paso.** Resumir qué se hizo, qué se verificó, qué no se pudo probar y qué tengo que ejecutar o revisar a mano (por ejemplo, SQL en Supabase).
- **Código de cliente y de servidor.** Las constantes o helpers que usen tanto componentes cliente como servidor viven en archivos sin imports de servidor (`next/headers`, cliente de Supabase del servidor).

## Convenciones del proyecto

- Estética monocromática: blanco y `#1a1a1a`, tipografías ya definidas en `globals.css`. No agregar colores nuevos.
- Tablas, columnas y tipos de base de datos en español, siguiendo el patrón existente (`proyectos`, `proyecto_imagenes`, `categorias`).
- Las imágenes usan `unoptimized: true` en `next.config.ts` para evitar los límites de Vercel Image Optimization. No cambiarlo.
- Los archivos HEIC se rechazan al subir, con un mensaje claro. No intentar convertirlos.
- Las rutas de `/admin` están protegidas por `src/proxy.ts`. Las páginas públicas no pasan por ahí.
- Las imágenes se guardan en el bucket `proyectos` de Supabase Storage. Las políticas del bucket no filtran por carpeta.
- Al borrar un registro con imágenes, o reemplazar una imagen, borrar también el archivo de Storage.

## Nexo Objects

Sección nueva del sitio para mostrar otro tipo de servicio o producto de diseño de interiores. Funciona parecido a Proyectos:

- Sin pasarela de pago. El precio es opcional e informativo, en pesos argentinos, y se muestra solo en la ficha del producto. Cada producto tiene un botón de consulta por WhatsApp, con el mensaje prellenado con el nombre del producto.
- Las dueñas lo administran todo desde `/admin`: categorías, productos con sus imágenes y descripción, orden y estado.
- Tablas propias: `objeto_categorias`, `objetos` y `objeto_imagenes`. No se mezclan con las de Proyectos.

### Modelo

- Categoría: nombre, slug (se genera una sola vez al crear y no cambia al renombrar), imagen con punto focal, orden y activo.
- Producto: nombre, descripción, categoría (obligatoria), orden, activo e imágenes (con portada y punto focal).
- El único estado es activo/inactivo. No hay etiqueta disponible/a pedido/agotado.
- Una categoría con productos no se puede borrar.
- precio opcional (entero mayor a 0, o vacío)
- - Subcategoría: pertenece a una categoría (tabla objeto_subcategorias), con nombre y orden. El modelo es genérico, pero hoy solo se usa en Lámparas. El producto tiene una subcategoría opcional (subcategoria_id) que debe pertenecer a su misma categoría.
- Borrar una subcategoría no oculta productos: quedan sin subcategoría y siguen visibles en "Todas".

### Regla de visibilidad pública

- Un producto se ve si está activo y su categoría está activa.
- Una categoría se ve si está activa y tiene al menos un producto visible.
- Si no hay ninguna categoría visible, `/objects` muestra "Próximamente".
- La capa de datos aplica los filtros `activo = true` de forma explícita en el código. No depende solo de RLS, porque una persona logueada en el admin que navega el sitio público corre las consultas como usuario autenticado.
- - Una subcategoría aparece en los filtros solo si tiene al menos un producto visible.
- Los filtros de subcategoría se muestran solo si la categoría tiene dos o más subcategorías visibles. Los productos sin subcategoría aparecen únicamente en "Todas".

### Rutas

- Público: `/objects` (cards de categorías), `/objects/[slug]` (productos de la categoría; el producto abre en un modal con imágenes, descripción y botón de WhatsApp).
- Admin: `/admin/objects/categorias` y `/admin/objects/productos`, con una sola entrada "Nexo Objects" en el menú del admin y pestañas dentro.

### Orden de construcción

0. SQL, tipos y capa de datos. Hecho.
1. Admin: entrada "Nexo Objects", pestañas y header responsive.
2. ABMC de categorías: imagen, orden, activo y compresor de imágenes (`src/lib/imagenes.ts`).
3. ABMC de productos: varias imágenes, portada, orden dentro de la categoría y activo.
4. Público: `/objects` con las cards de categorías.
5. Público: `/objects/[slug]` con productos, modal y WhatsApp.

## Mejoras pendientes

- **Compresor de imágenes en el resto del sitio.** El helper `comprimirImagen` se crea en el paso 2 y se usa en Objects. Evaluar aplicarlo también a Proyectos, Notas y Portada, para evitar costos inesperados de almacenamiento y tráfico en Supabase.
