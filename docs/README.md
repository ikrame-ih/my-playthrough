# Documentación del proyecto (MyPlaythrough)

Índice orientado a la revisión y despliegue.

**Idioma frente a nombres de archivo:** aquí el **contenido** (explicaciones, tablas del plan de pruebas, diagramas) está en **español** para facilitar la lectura en la revisión del proyecto. Los **nombres de fichero** (`schema.sql`, `plan_pruebas.html`, `diagrama_bd.html`) siguen **inglés o convención técnica** (SQL, HTML): es lo habitual en repositorios y evita problemas con herramientas y enlaces. No hace falta renombrar nada: lo que cuenta para la memoria es el **texto**, no el nombre del archivo.

En **`client/src/components/`** ocurre lo mismo al revés: los archivos se llaman en **inglés** (`GameList.jsx`, `AppShell.jsx`), pero las **cadenas que ve el usuario** en pantalla están en **español** en el código. Esa mezcla es intencionada y está alineada con el README principal.

| Fichero                       | Contenido                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `schema.sql`                  | Esquema completo de PostgreSQL (creación de tablas).                                                                                 |
| `add-avatar-id-usuarios.sql`  | Migración: columna `avatar_id` en usuarios ya existentes.                                                                            |
| `add-social-features.sql`     | Migración: `notificaciones_sonido`, `usuario_seguimientos`, `juego_recomendaciones`, `lfg_publicaciones`. También: `cd server && npm run migrate:social`. |
| `add-comentario-votos.sql`    | Tabla `juego_comentario_votos` (pulgar en reseñas). `cd server && npm run migrate:votes`. |
| `add-usuario-nombre-unique.sql` | Índice único en `LOWER(TRIM(nombre_usuario))`. `cd server && npm run migrate:username-unique`. |
| `add-catalogo-juegos.sql`     | Migraciones relacionadas con el catálogo (si aplica en tu historial).                                                                |
| `add-url-imagen-juegos.sql`   | Migración puntual de URL de imagen en juegos.                                                                                        |
| `promover-admin.sql`          | Plantilla para asignar rol admin a un email.                                                                                         |
| `fix-juegos-titulo-unique.sql` | Quita `UNIQUE` antiguas sobre `juegos.titulo` si molestan al tener el mismo título en varios usuarios.                                |
| `diagrama_bd.html`            | Diagrama lógico de tablas (abrir en navegador; botón de descarga incluido).                                                          |
| `plan_pruebas.html`           | Plan de pruebas; en el navegador: descargar HTML, imprimir o **Guardar como PDF** (estilos de impresión incluidos).                  |
| `pruebas.md`                  | Misma información que el HTML, en Markdown (fuente principal).                                                                       |
| `ERD.pgerd` / `ERD.pgerd.png` | Modelo entidad-relación (pgAdmin u otra herramienta), si los usas en la memoria.                                                     |
| `alcance_opcional_BD.md`      | Alcance opcional: qué ampliaciones de BD tendrían sentido solo con nuevas funcionalidades explícitas (likes, seguir usuarios, etc.). |

En la **raíz del repositorio**, [`DESIGN_ES.md`](../DESIGN_ES.md) es la traducción al español de [`DESIGN.md`](../DESIGN.md) (referencia de diseño de interfaz).

Para puesta en marcha y API, ver el **README** en la raíz del repositorio.
