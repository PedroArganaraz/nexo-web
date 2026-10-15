# Reglas generales del proyecto

Estas reglas aplican a todo el trabajo en este repositorio, en cada paso y sin que haga falta repetirlas en los prompts.

## Reglas de trabajo

- **Responsive siempre.** Todo se construye mobile-first y tiene que verse y funcionar bien en mobile y desktop (`md:` para desktop). Antes de dar un paso por terminado, revisar a 375px, 768px y 1280px: sin scroll horizontal, sin textos cortados ni solapamientos, y con áreas táctiles de al menos 40-44px. Esto incluye el panel de admin, que se usa también desde el celular.
- **Sin comentarios.** No dejar comentarios en el código: ni `//`, ni `/* */`, ni `{/* */}` en JSX, ni en CSS, ni en SQL. Los comentarios que ya existen en archivos que no se están tocando no se modifican.
- **Next.js 16.2.4.** Antes de usar APIs de Next, leer la guía correspondiente en `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- **Verificación.** Al terminar cada paso, correr `npx tsc --noEmit` y `npx eslint` sobre los archivos tocados.
- **Alcance.** Hacer solo lo que pide el paso actual. Si se detecta algo roto fuera del alcance, avisarlo al final en vez de arreglarlo sin que se pida.
- **Cierre de cada paso.** Resumir qué se hizo, qué se verificó y qué tengo que ejecutar o revisar a mano (por ejemplo, SQL en Supabase).

## Convenciones del proyecto

- Estética monocromática: blanco y `#1a1a1a`, tipografías ya definidas en `globals.css`. No agregar colores nuevos.
- Tablas, columnas y tipos de base de datos en español, siguiendo el patrón existente (`proyectos`, `proyecto_imagenes`, `categorias`).
- Las imágenes usan `unoptimized: true` en `next.config.ts` para evitar los límites de Vercel Image Optimization. No cambiarlo.
- Los archivos HEIC se rechazan al subir, con un mensaje claro. No intentar convertirlos.
- Las rutas de `/admin` están protegidas por `src/proxy.ts`. Las páginas públicas no pasan por ahí.

## Nexo Objects

Sección nueva del sitio, en `/objects`, para mostrar otro tipo de servicio o producto de diseño de interiores. Funciona como la sección Proyectos:

- Sin precios y sin pasarela de pago. Cada producto tiene un botón de consulta por WhatsApp.
- Las dueñas administran todo desde `/admin`: crear y editar productos con imágenes y descripción, cambiar estado, crear categorías y definir el orden de las publicaciones.
- Tablas propias: `objeto_categorias`, `objetos` y `objeto_imagenes`. No se mezclan con las de Proyectos.
- Estados de un producto: `disponible`, `a_pedido`, `agotado`. El campo `activo` controla si está publicado.

Orden de construcción:

1. Botón "Nexo Objects" en el navbar y página `/objects` con la estructura inicial.
2. Base de datos, tipos y capa de datos.
3. Grilla pública y detalle de cada producto con botón de WhatsApp.
4. Admin: productos, categorías, orden y estado.

## Mejoras pendientes

- **Compresor de imágenes al subirlas.** Cuando Nexo Objects ya esté avanzado, comprimir cada imagen en el navegador antes de subirla a Supabase, reduciendo peso y dimensiones sin pérdida de calidad visible. El objetivo es evitar costos inesperados de almacenamiento y tráfico en Supabase. Aplicar primero a Objects y evaluar extenderlo a Proyectos, Notas y portada.
