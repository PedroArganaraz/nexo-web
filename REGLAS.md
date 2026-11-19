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
- **Variantes de las imágenes de galería de Proyectos.** Cada imagen nueva de la galería se sube en tres versiones, en la misma carpeta, con el mismo formato y la misma extensión (WebP, o JPEG si el navegador no puede generar WebP): la grande `{carpeta}/{uuid}.{ext}` (lado mayor de 1920 px como máximo), `{uuid}-card.{ext}` (1280 px) y `{uuid}-thumb.{ext}` (320 px). Solo se achican, nunca se recortan ni se agrandan, y se aplica la orientación EXIF, así que los puntos focales siguen valiendo. Los límites, las calidades (0.82) y los sufijos viven en `src/lib/imagenes-constantes.ts`, que no importa nada de React ni del navegador y lo usan tanto la app como el script de migración.
  - La base de datos guarda solo la ruta y la URL de la versión grande. Las otras se derivan por nombre con `rutaVariante` y `urlVariante` (`src/lib/imagenes.ts`).
  - Cualquier borrado de una imagen de galería tiene que borrar las tres versiones (`rutasConVariantes`). Que una variante no exista no es un error.
  - Las imágenes subidas antes de este cambio no tienen variantes. Por eso la interfaz las muestra con `ImagenVariante` (`src/components/ui/ImagenVariante.tsx`), que pide la variante y, si no carga, cae una sola vez a la URL grande.
  - Tarjetas del Portfolio: variante `card`. Miniaturas del Lightbox, de la lista de Proyectos y de la galería del formulario: variante `thumb`. La foto principal del Lightbox usa la grande.
  - No se generan variantes para antes y después, Portada ni Objects.
- **Migración de imágenes viejas (`scripts/migrar-imagenes.ts`).** Convierte a WebP las imágenes de galería, antes y después y Portada subidas antes de la compresión, y genera las variantes card y thumb de la galería. Objects no se toca. Se corre desde la raíz del proyecto con Node 22: `node --experimental-strip-types scripts/migrar-imagenes.ts [opciones]`.
  - Sin opciones o con `--dry-run`: no escribe nada. Lee con la clave anónima y muestra por proyecto cuántas imágenes hay, cuánto pesan, en qué formato y cuáles se migrarían, más los archivos huérfanos del bucket.
  - `--apply`: migra. Por cada imagen descarga el original, genera las versiones, las sube con caché de un año, verifica que existan y tengan el tamaño esperado, y recién entonces actualiza la fila. Si algo falla, no toca la base para esa imagen y borra lo que se había subido de ella.
  - `--proyecto <id o nombre>`, `--portada` y `--limite N` acotan qué se procesa. `--revertir <archivo>` vuelve la base a las rutas y URLs anteriores usando un respaldo.
  - Antes de escribir, guarda los valores anteriores en `scripts/respaldo/{fecha-hora}.json` (ignorado por git). Se puede correr más de una vez: lo ya migrado se omite.
  - **Los originales nunca se borran de Storage**: quedan como respaldo y por eso `--revertir` es posible.
  - `--apply` y `--revertir` necesitan `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`. Esa clave vive solo ahí: nunca en el código, en variables `NEXT_PUBLIC_*` ni en Vercel, y el script nunca la imprime.
- Cualquier dato privado del negocio (costos, proveedores, márgenes) va en tablas sin acceso para anon, nunca como columna de una tabla que el sitio público lee.

## Nexo Objects

Sección nueva del sitio para mostrar otro tipo de servicio o producto de diseño de interiores. Funciona parecido a Proyectos:

- Sin pasarela de pago. El precio es opcional e informativo, en pesos argentinos, y se muestra solo en la ficha del producto. Cada producto tiene un botón de consulta por WhatsApp, con el mensaje prellenado con el nombre del producto.
- Las dueñas lo administran todo desde `/admin`: categorías, productos con sus imágenes y descripción, orden y estado.
- Tablas propias: `objeto_categorias`, `objetos` y `objeto_imagenes`. No se mezclan con las de Proyectos.

### Modelo

- Categoría: nombre, slug (se genera una sola vez al crear y no cambia al renombrar), imagen con punto focal, orden y activo.
- Producto: nombre, slug, descripción, categoría (obligatoria), orden, activo e imágenes (con portada y punto focal).
- El slug del producto se genera una sola vez al crearlo, es único en toda la tabla `objetos` y nunca cambia: ni al renombrar el producto ni al moverlo de categoría.
- El único estado es activo/inactivo. No hay etiqueta disponible/a pedido/agotado.
- Una categoría con productos no se puede borrar.
- precio opcional (entero mayor a 0, o vacío)
- Subcategoría: pertenece a una categoría (tabla objeto_subcategorias), con nombre y orden. El modelo es genérico, pero hoy solo se usa en Lámparas. El producto tiene una subcategoría opcional (subcategoria_id) que debe pertenecer a su misma categoría.
- Borrar una subcategoría no oculta productos: quedan sin subcategoría y siguen visibles en "Todas".
- Datos internos del producto (costo y proveedor, ambos opcionales) viven en la tabla objeto_datos_internos, solo para usuarios autenticados. El beneficio y el margen no se guardan: se calculan como precio menos costo, y margen sobre el precio de venta.
- Estos datos nunca se muestran en el sitio público ni se consultan desde código público (src/lib/objetos.ts, páginas de /objects y componentes del sitio). Solo los usa el admin.

### Recorte de las fotos de productos

- La foto principal de la ficha del producto (`ObjetoModal`) usa un marco de proporción fija 5:4 (ancho/alto) en todos los anchos de pantalla. La foto siempre llena el marco con zoom (`object-cover`), sin bandas, y el recorte lo decide el punto focal de cada imagen (`focal_x`, `focal_y`). El marco no cambia de tamaño al pasar de una foto a otra ni mientras carga.
- La proporción vive en la constante `PROPORCION_FICHA` (`src/lib/objetos-constantes.ts`). El editor de recorte de productos (`FocalPointModal` desde `ObjetoForm`) importa esa misma constante para su marco, así que no pueden desincronizarse. Si cambia la proporción de la ficha, se cambia solo ahí.
- El editor de productos muestra además una vista previa de la tarjeta cuadrada del listado con el mismo punto focal. El punto elegido es el centro del zoom en las dos.
- Las tarjetas del listado de productos y de categorías siguen siendo cuadradas (1:1). Las categorías de Objects y los Proyectos mantienen sus proporciones en el editor (1:1 y 4:3).

### Regla de visibilidad pública

- Un producto se ve si está activo y su categoría está activa.
- Una categoría se ve si está activa y tiene al menos un producto visible.
- Si no hay ninguna categoría visible, `/objects` muestra "Próximamente".
- La capa de datos aplica los filtros `activo = true` de forma explícita en el código. No depende solo de RLS, porque una persona logueada en el admin que navega el sitio público corre las consultas como usuario autenticado.
- Una subcategoría aparece en los filtros solo si tiene al menos un producto visible.
- Los filtros de subcategoría se muestran solo si la categoría tiene dos o más subcategorías visibles. Los productos sin subcategoría aparecen únicamente en "Todas".

### Rutas

- Público: `/objects` (cards de categorías), `/objects/[slug]` (productos de la categoría; el producto abre en un modal con imágenes, descripción y botón de WhatsApp).
- Público: `/objects/[slug]/[producto]` es el link propio de cada producto. Abre la página de la categoría con ese producto ya abierto en el modal. Dentro del sitio, abrir un producto cambia la URL sin recargar y el botón atrás lo cierra. Ambas rutas comparten la misma página (`src/app/objects/[slug]/[[...producto]]/page.tsx`).
- Redirección canónica: si el slug de categoría de la URL no coincide con la categoría actual del producto (se movió de categoría o cambió el slug de la categoría), se responde con un redirect permanente a `/objects/[categoría actual]/[producto]`. Si el producto no existe, está inactivo o su categoría está inactiva, la respuesta es 404.
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
