# Documentación del proyecto (MyPlaythrough)

Índice de la carpeta `docs/` para la evaluación del trabajo y para quien consulte el repositorio. La guía de instalación, variables de entorno y descripción general de la API figuran en el [`README.md`](../README.md) de la raíz del proyecto.

**Para revisar el plan de pruebas completo**, lo más cómodo es abrir en el navegador [`abrir-en-navegador/plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html) (mejor lectura que el Markdown e impresión a PDF). El texto fuente es [`pruebas.md`](pruebas.md). El recuento cerrado en ese documento es **58 pruebas manuales** (46 con prefijo **P-**, 8 **S-**, 4 **V-**) más **27 pruebas unitarias** (Vitest).

---

## Documentación en HTML (`abrir-en-navegador/`)

Los ficheros maquetados para **visualización en navegador** (estilos propios; el plan de pruebas admite impresión o exportación a PDF desde el propio navegador) se encuentran en esta subcarpeta:

| Ruta                                                                                             | Contenido                                                                                                           |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [`abrir-en-navegador/diagrama_bd.html`](abrir-en-navegador/diagrama_bd.html)                     | Modelo de datos: diagramas por bloques, tabla de claves foráneas y detalle de columnas.                             |
| [`abrir-en-navegador/flujo_pern_tres_capas.html`](abrir-en-navegador/flujo_pern_tres_capas.html) | Tres **capas apiladas** (presentación / negocio / persistencia), flujo **1–8** y leyenda a la derecha.              |
| [`abrir-en-navegador/funciones_principales.html`](abrir-en-navegador/funciones_principales.html) | Funciones relevantes del código, temario de apoyo del ciclo (JWT, middleware, HTTP, etc.) y referencias a ficheros. |
| [`abrir-en-navegador/plan_pruebas.html`](abrir-en-navegador/plan_pruebas.html)                   | Plan de pruebas en formato página.                                                                                  |

La **fuente en texto** del plan de pruebas es [`pruebas.md`](pruebas.md); su contenido es el mismo que el HTML anterior.

---

## Scripts SQL (`sql/`)

| Contenido                            | Ubicación                                                        |
| ------------------------------------ | ---------------------------------------------------------------- |
| Esquema completo de la base de datos | [`sql/schema.sql`](sql/schema.sql)                               |
| Migraciones y ajustes puntuales      | `sql/add-*.sql`, `sql/fix-*.sql`, `sql/promover-admin.sql`, etc. |

En `schema.sql` figuran **ocho tablas** del modelo actual: núcleo (`usuarios`, `catalogo_juegos`, `juegos`), comentarios y votos (`juego_comentarios`, `juego_comentario_votos`) y bloque social (`usuario_seguimientos`, `juego_recomendaciones`, `lfg_publicaciones`).

**Relación entre documentos:** el esquema definido en `sql/schema.sql` es el referenciado por el diagrama en `abrir-en-navegador/diagrama_bd.html`. El plan de pruebas en [`pruebas.md`](pruebas.md) y la versión en `abrir-en-navegador/plan_pruebas.html` describen el mismo contenido.

Las migraciones ejecutables desde `server/` mediante `npm run migrate:*` aplican los scripts SQL correspondientes bajo `docs/sql/`.

---

**Interfaz y diseño:** [`DESIGN_ES.md`](../DESIGN_ES.md) y [`DESIGN.md`](../DESIGN.md) (raíz del repositorio).

La documentación en prosa está redactada en **español**; los **nombres de archivo** siguen convenciones habituales en código (`schema.sql`, `plan_pruebas.html`).
