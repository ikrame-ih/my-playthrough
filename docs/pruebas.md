# Plan de pruebas — MyPlaythrough

**Proyecto:** MyPlaythrough  
**Alumna:** Ikrame Ibn Hayoun  
**Ciclo:** Desarrollo de Aplicaciones Web — CESUR Málaga Este  
**Curso:** 2025/2026

**Consulta recomendada para la evaluación:** el plan completo se visualiza con más claridad en **`docs/abrir-en-navegador/plan_pruebas.html`** (navegador): tablas maquetadas, secciones diferenciadas e impresión o exportación a **PDF** desde el menú de imprimir del propio navegador. Este fichero **`docs/pruebas.md`** es la fuente en texto del mismo contenido.

---

## 1. Finalidad y alcance

Este documento describe **qué se ha probado**, **cómo** y **con qué resultado** en la aplicación MyPlaythrough. Incluye pruebas **manuales** (interfaz y API con Thunder Client) y **unitarias automáticas** (Vitest), sin sustituir la revisión funcional completa del código en el repositorio.

---

## 2. Tipos de prueba realizadas

| Tipo                  | Descripción breve                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Manuales funcionales  | Comprobación de flujos de usuario (registro, colección, comunidad, social ampliado, admin, comentarios).                                         |
| Seguridad básica      | Acceso a rutas protegidas sin token, permisos, límites de cuerpo, límite de frecuencia en login/registro, endpoint de diagnóstico en producción. |
| Validación de datos   | Normalización de entradas (email, título, estado, plataforma) coherente con el backend.                                                          |
| Unitarias automáticas | Tests repetibles sobre lógica pura (sin navegador ni base de datos), ejecutados con Vitest 3.                                                    |

---

## 3. Entorno de prueba

| Parámetro         | Valor                                     |
| ----------------- | ----------------------------------------- |
| Sistema operativo | Windows 11                                |
| Navegador         | Google Chrome 124                         |
| Backend           | Node.js 20, Express 5, puerto 3000        |
| Frontend          | Vite, React 18, puerto 5173               |
| Base de datos     | PostgreSQL 16 (local o contenedor Docker) |
| Cliente API       | Thunder Client (extensión de VS Code)     |

---

## 4. Pruebas automáticas unitarias (Vitest)

Se ejecutan en terminal, desde la carpeta de cada paquete, **sin** levantar obligatoriamente Docker ni PostgreSQL para los tests del `normalize` y utilidades del cliente.

| Ubicación            | Comando    | Ficheros / ámbito                                                                                                                           |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend (`server/`)  | `npm test` | `server/utils/normalize.js` (email, contraseña fuerte, título, plataforma, estado, referencia catálogo, payload de error según `NODE_ENV`). |
| Frontend (`client/`) | `npm test` | `gameLabels.js`, `coverUrl.js`, `passwordPolicy.js`.                                                                                        |

- Modo vigilancia (opcional): `npm run test:watch` en `server` o `client`.
- **Herramienta:** Vitest 3 (compatible con Vite en el cliente y con Node en el servidor).

**Relación con validación manual:** los casos V-01 a V-04 del apartado 8 están alineados con la lógica probada en `normalize.js`.

---

## 5. Pruebas manuales funcionales

### 5.1. RF-01 — Gestión de usuarios (autenticación)

| ID    | Caso                  | Pasos (resumen)                                                 | Esperado                                                                | Obtenido                                            | Estado |
| ----- | --------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- | ------ |
| P-01  | Registro válido       | Login → Crear cuenta → datos válidos → Registrarse              | Redirección al dashboard; JWT en `localStorage`                         | Colección vacía visible; sesión iniciada            | OK     |
| P-02  | Email duplicado       | Registrar de nuevo el mismo email                               | Error claro; no duplicado                                               | Mensaje de error mostrado                           | OK     |
| P-03  | Contraseña corta      | Contraseña de menos de 8 caracteres                             | Validación; no se envía                                                 | Mensaje en formulario (política fuerte en servidor) | OK     |
| P-04  | Login correcto        | Email y contraseña válidos                                      | JWT y acceso al dashboard                                               | Dashboard accesible                                 | OK     |
| P-05  | Contraseña incorrecta | Email válido, contraseña errónea                                | 401; sin acceso                                                         | Error mostrado                                      | OK     |
| P-06  | Email inexistente     | Email no registrado                                             | 401; mensaje coherente                                                  | Error mostrado                                      | OK     |
| P-07  | Cerrar sesión         | Botón en sidebar                                                | Token eliminado; pantalla de login                                      | Logout correcto                                     | OK     |
| P-08  | Sesión tras F5        | Recargar estando logueada                                       | Sesión mantenida                                                        | Mantiene autenticación                              | OK     |
| P-08b | Avatar de perfil      | Ajustes → Perfil → elegir otro robot                            | `PATCH /api/auth/me` correcto; avatar en barra, comunidad y comentarios | Cambio visible tras guardar                         | OK     |
| P-08c | Avatar inválido (API) | Thunder Client: `PATCH /api/auth/me` con `avatar_id` no listado | 400                                                                     | Rechazado                                           | OK     |

### 5.2. RF-02 — Biblioteca (CRUD)

| ID   | Caso                | Pasos (resumen)                             | Esperado                   | Obtenido                 | Estado |
| ---- | ------------------- | ------------------------------------------- | -------------------------- | ------------------------ | ------ |
| P-09 | Añadir manual       | Añadir juego con título, estado, plataforma | Aparece en la colección    | Visible en dashboard     | OK     |
| P-10 | Añadir con buscador | Búsqueda → elegir resultado → guardar       | Carátula desde CDN         | Imagen y ficha correctas | OK     |
| P-11 | Duplicado           | Mismo título que uno existente              | Error; no duplicar         | Mensaje; una sola ficha  | OK     |
| P-12 | Sin título          | Guardar con título vacío                    | Validación                 | Error en formulario      | OK     |
| P-13 | Editar estado       | Detalle → cambiar estado → guardar          | Estado actualizado         | Correcto                 | OK     |
| P-14 | Editar nota y horas | Cambiar puntuación y horas                  | Valores persistidos        | Correcto                 | OK     |
| P-15 | Eliminar            | Eliminar y confirmar                        | Desaparece de la colección | Eliminado                | OK     |
| P-16 | Filtro por estado   | Filtro "Completados" en sidebar             | Solo completados           | Filtro correcto          | OK     |

### 5.3. RF-03 — Edición de detalles

| ID   | Caso                | Pasos                      | Esperado                      | Obtenido               | Estado |
| ---- | ------------------- | -------------------------- | ----------------------------- | ---------------------- | ------ |
| P-17 | Nota fuera de rango | Valor > 10                 | Bloqueo o aviso en UI         | `max=10` en formulario | OK     |
| P-18 | Horas negativas     | Introducir horas negativas | Normalización a 0 en servidor | Guardado 0 en BD       | OK     |

### 5.4. RF-04 — Comunidad

| ID   | Caso              | Pasos                             | Esperado                                             | Obtenido    | Estado |
| ---- | ----------------- | --------------------------------- | ---------------------------------------------------- | ----------- | ------ |
| P-19 | Lista de miembros | Entrar en Comunidad               | Lista con juegos, seguidores y plataforma de ejemplo | Correcta    | OK     |
| P-20 | Perfil ajeno      | Clic en miembro                   | Colección ajena solo lectura                         | Sin edición | OK     |
| P-21 | Sin token         | Acceder a `/community` sin sesión | 401; redirección a login                             | Bloqueado   | OK     |

### 5.5. RF-05 — Estadísticas

| ID   | Caso                | Pasos                                 | Esperado                  | Obtenido             | Estado |
| ---- | ------------------- | ------------------------------------- | ------------------------- | -------------------- | ------ |
| P-22 | Ranking global      | Comunidad → estadísticas              | Media y número de votos   | Cálculo SQL correcto | OK     |
| P-23 | Media con dos votos | Mismo juego puntuado por dos usuarios | Media aritmética correcta | Ej.: 8 y 6 → 7,00    | OK     |

### 5.6. RF-06 — Administración

| ID   | Caso                       | Pasos                                                  | Esperado                                             | Obtenido            | Estado |
| ---- | -------------------------- | ------------------------------------------------------ | ---------------------------------------------------- | ------------------- | ------ |
| P-24 | Usuario normal en `/admin` | Acceso sin rol admin                                   | 403; sin enlace en UI                                | Bloqueado           | OK     |
| P-25 | Listado admin              | Admin → panel                                          | Tabla de usuarios                                    | Datos visibles      | OK     |
| P-26 | Borrar otro usuario        | Eliminar fila de otro usuario                          | Usuario y juegos en cascada                          | Correcto            | OK     |
| P-27 | No auto-borrado            | Admin intenta borrarse a sí misma                      | Error controlado                                     | Operación bloqueada | OK     |
| P-44 | Panel LFG (admin)          | Admin → sección Buscar grupo (LFG) → eliminar una fila | Publicación borrada; desaparece también en Comunidad | Correcto            | OK     |

### 5.7. Comentarios en ficha de juego

| ID   | Caso                | Pasos                                             | Esperado                     | Obtenido                | Estado |
| ---- | ------------------- | ------------------------------------------------- | ---------------------------- | ----------------------- | ------ |
| P-28 | Publicar comentario | Abrir hilo → enviar texto                         | Comentario con autor y fecha | Publicado               | OK     |
| P-29 | Borrar propio       | Eliminar comentario propio                        | Desaparece del hilo          | Eliminado correctamente | OK     |
| P-30 | Borrar ajeno (API)  | Thunder Client: borrar comentario de otra persona | 403                          | Bloqueado               | OK     |

### 5.8. RF-07 — Social ampliado (seguimientos, recomendaciones, LFG, actividad)

| ID   | Caso                        | Pasos (resumen)                                                         | Esperado                                        | Obtenido  | Estado |
| ---- | --------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- | --------- | ------ |
| P-31 | Seguir desde perfil         | Comunidad → perfil ajeno → Seguir                                       | `POST /api/social/follow/:id`; estado coherente | Correcto  | OK     |
| P-32 | Dejar de seguir             | Perfil → Dejar de seguir                                                | `DELETE`; puede volver a seguir                 | Correcto  | OK     |
| P-33 | Seguir desde tarjeta        | Comunidad → Miembros → Seguir en la tarjeta                             | Pasa a «Siguiendo»                              | Correcto  | OK     |
| P-34 | Recomendar sin seguir (API) | Thunder: `POST /api/social/recommendations` sin relación de seguimiento | 403                                             | Rechazado | OK     |
| P-35 | Recomendar desde colección  | Icono regalo en ficha propia → destinatario seguido → enviar            | En bandeja del destinatario                     | Correcto  | OK     |
| P-36 | Bandeja y leídas            | Campana → Recomendaciones → marcar leída / discusión                    | Contador y estado coherentes                    | Correcto  | OK     |
| P-37 | Publicar LFG                | Comunidad → Buscar grupo → formulario válido                            | Aparece en listado                              | Correcto  | OK     |
| P-38 | Listado LFG                 | Varios usuarios publican                                                | Orden reciente; autor y juego                   | Correcto  | OK     |
| P-39 | Borrar LFG propia           | Eliminar en tarjeta (autor o admin)                                     | Desaparece                                      | Correcto  | OK     |
| P-40 | Actividad de seguidos       | Tras seguir: comentario o LFG del seguido → pestaña Actividad           | Entradas con enlace a ficha                     | Correcto  | OK     |

### 5.9. RF-08 — Preferencias y presentación (tour, notificaciones, métricas sociales)

| ID   | Caso                    | Pasos (resumen)                                                                                                                                                                                       | Esperado                                            | Obtenido | Estado |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------- | ------ |
| P-41 | Tour guiado repetible   | Perfil → Iniciar tour guiado                                                                                                                                                                          | Recorrido por la interfaz; se puede cerrar          | Correcto | OK     |
| P-42 | Tono de recomendaciones | Sonido activado en Perfil; dos cuentas; la segunda recomienda a la primera; con la pestaña del destinatario visible, comprobar contador de la campana y tono (la app consulta el servidor cada ~45 s) | Contador y tono opcional coherentes con Perfil      | Correcto | OK     |
| P-43 | Contador de seguidores  | Comunidad → Miembros y perfil público                                                                                                                                                                 | Número de seguidores visible y coherente con la API | Correcto | OK     |

---

## 6. Pruebas de seguridad (API / configuración)

| ID   | Caso                  | Herramienta / condición                                                                                                                   | Esperado | Obtenido                | Estado |
| ---- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------- | ------ |
| S-01 | Sin token             | `GET /api/games` sin `Authorization`                                                                                                      | 401      | JSON de error coherente | OK     |
| S-02 | JWT alterado          | Token modificado a mano                                                                                                                   | 401      | Rechazado               | OK     |
| S-03 | Juego de otro usuario | `GET /api/games/:id` con juego de otro `usuario_id`                                                                                       | 404      | Sin datos ajenos        | OK     |
| S-04 | Admin sin rol         | `GET /api/admin/users` con JWT de usuario                                                                                                 | 403      | Mensaje de permisos     | OK     |
| S-05 | test-db en producción | `NODE_ENV=production` y `GET /api/test-db`                                                                                                | 404      | Endpoint oculto         | OK     |
| S-06 | Body > 50 KB          | Registro con payload grande                                                                                                               | 413      | Rechazado               | OK     |
| S-07 | Social sin token      | `GET /api/social/lfg` sin `Authorization`                                                                                                 | 401      | Rechazado               | OK     |
| S-08 | Límite login/registro | Más de **40** peticiones `POST` a `/api/auth/login` o `/api/auth/register` desde la **misma IP** en **15 minutos** (`express-rate-limit`) | 429      | JSON de error coherente | OK     |

---

## 7. Validación de datos (coherencia con backend)

| ID   | Caso             | Entrada / acción          | Esperado                                 | Estado |
| ---- | ---------------- | ------------------------- | ---------------------------------------- | ------ |
| V-01 | Email            | `"  Usuario@GMAIL.com  "` | Normalizado a `usuario@gmail.com`        | OK     |
| V-02 | Título           | `"The  Witcher   3"`      | `"The Witcher 3"` (`normalizeGameTitle`) | OK     |
| V-03 | Estado en inglés | `estado: "Completed"`     | Guardado como `Completado`               | OK     |
| V-04 | Plataforma vacía | Sin campo `plataforma`    | Por defecto `PC`                         | OK     |

---

## 8. Resumen numérico

**Comprobación del recuento (por ID):**

- **P-01 … P-44** → **44** casos (incluye RF-06 ampliado con listado LFG en admin, RF-07 social, RF-08 presentación).
- **S-01 … S-08** → **8** casos (seguridad API / configuración).
- **V-01 … V-04** → **4** casos (validación de datos coherente con el backend).

**Total pruebas manuales: 44 + 8 + 4 = 56.**

| Categoría                                   | Total  | Pasadas | Fallidas |
| ------------------------------------------- | ------ | ------- | -------- |
| Flujo de aplicación (P-01 … P-44)           | 44     | 44      | 0        |
| Seguridad API / configuración (S-01 … S-08) | 8      | 8       | 0        |
| Validación de datos (V-01 … V-04)           | 4      | 4       | 0        |
| **Total pruebas manuales**                  | **56** | **56**  | **0**    |
| Unitarias automáticas (Vitest)              | 27     | 27      | 0        |

_Las 27 pruebas unitarias corresponden a 17 tests en `server` y 10 en `client` (`npm test` en cada carpeta)._

---

## 9. Cosas que dejaría para más adelante (no están hechas)

1. **Mensajes de error más uniformes:** según la ruta el JSON de error puede cambiar un poco de forma; lo suyo sería centralizarlo (p. ej. middleware) y que en producción no se envíen al cliente detalles técnicos largos.
2. **Campana sin ir preguntando cada X segundos:** hoy la campana usa *polling*; en un producto grande habría que valorar **WebSockets** o **SSE** para avisos al momento (más trabajo de despliegue y reconexión).
3. **Juntar dos fichas del mismo juego:** si hubiera dos entradas duplicadas, haría falta un flujo que las una y mueva comentarios y votos (sobre todo si ya comparten `catalogo_id`).
4. **Tests que peguen contra la API de verdad:** además de las unitarias, una suite tipo **Supertest** con API y base de prueba levantadas para pillar fallos entre capas.
