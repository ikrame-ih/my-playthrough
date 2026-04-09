# Documentación del proyecto (MyPlaythrough)

Índice orientado a la revisión y despliegue.

**Idioma frente a nombres de archivo:** aquí el **contenido** (explicaciones, tablas del plan de pruebas, diagramas) está en **español** para facilitar la lectura en la revisión del proyecto. Los **nombres de fichero** (`schema.sql`, `plan_pruebas.html`, `diagrama_bd.html`) siguen **inglés o convención técnica** (SQL, HTML): es lo habitual en repositorios y evita problemas con herramientas y enlaces. No hace falta renombrar nada: lo que cuenta para la memoria es el **texto**, no el nombre del archivo.

En **`client/src/components/`** ocurre lo mismo al revés: los archivos se llaman en **inglés** (`GameList.jsx`, `AppShell.jsx`), pero las **cadenas que ve el usuario** en pantalla están en **español** en el código. Esa mezcla es intencionada y está alineada con el README principal.

| Fichero | Contenido |
|--------|-----------|
| `schema.sql` | Esquema completo de PostgreSQL (creación de tablas). |
| `add-avatar-id-usuarios.sql` | Migración: columna `avatar_id` en usuarios ya existentes. |
| `add-catalogo-juegos.sql` | Migraciones relacionadas con el catálogo (si aplica en tu historial). |
| `add-url-imagen-juegos.sql` | Migración puntual de URL de imagen en juegos. |
| `promover-admin.sql` | Plantilla para asignar rol admin a un email. |
| `diagrama_bd.html` | Diagrama lógico de tablas (abrir en navegador; botón de descarga incluido). |
| `plan_pruebas.html` | Plan de pruebas; en el navegador: descargar HTML, imprimir o **Guardar como PDF** (estilos de impresión incluidos). |
| `pruebas.md` | Misma información que el HTML, en Markdown (fuente principal). |
| `ERD.pgerd` / `ERD.pgerd.png` | Modelo entidad-relación (pgAdmin u otra herramienta), si los usas en la memoria. |

Para puesta en marcha y API, ver el **README** en la raíz del repositorio.
