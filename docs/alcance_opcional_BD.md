# Alcance del modelo de datos (social ampliado)

## Implementado en el esquema actual

Además del núcleo (`usuarios`, `catalogo_juegos`, `juegos`, `juego_comentarios`), el proyecto incluye:

| Tabla / columna | Función |
|-----------------|--------|
| `usuarios.notificaciones_sonido` | Preferencia para el tono al recibir recomendaciones nuevas (UI + campana). |
| `usuario_seguimientos` | Grafo seguidor → seguido (único por par; no auto-seguimiento). |
| `juego_recomendaciones` | Recomendación de una **ficha del remitente** hacia otro usuario; mensaje opcional; `leida`. Solo se puede enviar si existe seguimiento (`seguidor_id` = remitente, `seguido_id` = destinatario). |
| `lfg_publicaciones` | “Buscar grupo”: mensaje, modo (`online` / `coop_local` / `otro`) y enlace a un juego de la colección del autor. |

Las **estadísticas globales** siguen derivándose con SQL sobre `juegos`, sin tabla de agregados duplicada.

**Migración en BD ya existente:** [`add-social-features.sql`](add-social-features.sql). Instalaciones nuevas desde [`schema.sql`](schema.sql) ya lo incluyen.

## Posibles ampliaciones futuras (no implementadas)

- “Me gusta” en comentarios, mensajería privada, notificaciones genéricas multi-tipo.
- Valoración global independiente de la nota de la ficha personal.
- Metadatos automáticos multijugador desde RAWG/Steam (el LFG actual confía en el criterio de la usuaria).

Cada feature adicional debería venir con alcance, migración, API, pruebas y actualización del plan de pruebas.
