# Plan de Pruebas — MyPlaythrough

**Proyecto:** MyPlaythrough  
**Alumna:** Ikrame Ibn Hayoun  
**Ciclo:** Desarrollo de Aplicaciones Web — CESUR Málaga Este  
**Curso:** 2025/2026  
**Entrega:** 4 — Proyecto Final

---

## Tipos de prueba realizadas

- **Pruebas manuales funcionales**: verifican que cada funcionalidad del sistema funciona como se espera desde la perspectiva del usuario.
- **Pruebas de seguridad básicas**: verifican que las rutas protegidas no son accesibles sin credenciales válidas.
- **Pruebas de validación**: verifican que el sistema rechaza datos incorrectos con mensajes de error apropiados.

---

## Entorno de prueba

| Parámetro | Valor |
|---|---|
| Sistema operativo | Windows 11 |
| Navegador | Google Chrome 124 |
| Backend | Node.js 20 · Express 5 · Puerto 3000 |
| Frontend | Vite + React 18 · Puerto 5173 |
| Base de datos | PostgreSQL 16 (local) |
| Herramienta API | Thunder Client (extensión VS Code) |

---

## Pruebas funcionales

### RF-01 — Gestión de usuarios (Autenticación)

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| P-01 | Registro con datos válidos | 1. Ir a la pantalla de login. 2. Pulsar "Crear cuenta". 3. Rellenar nombre, email y contraseña (6+ caracteres). 4. Pulsar "Registrarse". | La app redirige al dashboard. El token JWT queda guardado en `localStorage`. | El usuario queda logueado y se muestra la colección vacía. | ✅ OK |
| P-02 | Registro con email ya existente | Repetir el registro con el mismo email. | El formulario muestra el error "Ese email ya está registrado". | Se muestra el mensaje de error sin crear duplicado. | ✅ OK |
| P-03 | Registro con contraseña corta (< 6 caracteres) | Rellenar el formulario con contraseña "123". | Error de validación: "La contraseña debe tener al menos 6 caracteres". | Se muestra el mensaje y no se envía la petición. | ✅ OK |
| P-04 | Login con credenciales correctas | Introducir email y contraseña de una cuenta existente. | El sistema devuelve un JWT y redirige al dashboard. | Login correcto, dashboard visible. | ✅ OK |
| P-05 | Login con contraseña incorrecta | Introducir email correcto y contraseña errónea. | Error 401: "Contraseña incorrecta". | Se muestra el mensaje de error sin acceso. | ✅ OK |
| P-06 | Login con email no registrado | Introducir un email que no existe. | Error 401: "No existe ninguna cuenta con ese email". | Se muestra el mensaje de error. | ✅ OK |
| P-07 | Cierre de sesión | Pulsar el botón "Cerrar sesión" en el sidebar. | El token se elimina de `localStorage` y se muestra la pantalla de login. | Logout correcto. | ✅ OK |
| P-08 | Persistencia de sesión al recargar | Recargar la página (F5) estando logueado. | El usuario permanece autenticado (token válido en `localStorage`). | La sesión se mantiene. | ✅ OK |

---

### RF-02 — Gestión de la biblioteca (CRUD)

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| P-09 | Añadir juego manualmente | 1. Pulsar "+ Añadir juego". 2. Escribir título, seleccionar estado y plataforma. 3. Pulsar "Guardar". | El juego aparece en la colección. | Juego añadido y visible en el dashboard. | ✅ OK |
| P-10 | Añadir juego desde el buscador (Steam) | 1. En el formulario de añadir, escribir un título en la búsqueda. 2. Seleccionar un resultado. 3. Guardar. | El juego se añade con la carátula del CDN. | Juego con imagen añadido correctamente. | ✅ OK |
| P-11 | Añadir juego duplicado | Intentar añadir un título que ya existe en la colección. | Error: "Este juego ya está en tu colección". | Se muestra el mensaje y no se crea duplicado. | ✅ OK |
| P-12 | Añadir juego sin título | Dejar el campo título vacío y pulsar "Guardar". | Error de validación: "El título es obligatorio". | El formulario muestra el error y no envía la petición. | ✅ OK |
| P-13 | Editar estado de un juego | 1. Pulsar sobre un juego. 2. Cambiar el estado de "Pendiente" a "Completado". 3. Guardar. | El juego se actualiza con el nuevo estado. | Estado actualizado correctamente. | ✅ OK |
| P-14 | Editar puntuación y horas jugadas | Cambiar la puntuación a 8.5 y las horas a 45. Guardar. | Los nuevos valores quedan guardados. | Datos actualizados correctamente. | ✅ OK |
| P-15 | Eliminar un juego | Pulsar el botón "Eliminar" en el detalle de un juego y confirmar. | El juego desaparece de la colección. | Juego eliminado correctamente. | ✅ OK |
| P-16 | Filtrar colección por estado | Seleccionar el filtro "Completados" en el sidebar. | Solo se muestran los juegos con estado "Completado". | El filtro funciona correctamente. | ✅ OK |

---

### RF-03 — Edición de detalles

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| P-17 | Puntuación fuera de rango | Introducir una puntuación de 11 (máximo esperado: 10). | El campo no acepta el valor o muestra un aviso. | El campo tiene restricción `max=10` en el formulario. | ✅ OK |
| P-18 | Horas negativas | Introducir -5 en el campo de horas jugadas. | El backend normaliza el valor a 0 (`Math.max(0, horas)`). | Se guarda 0 en la BD. | ✅ OK |

---

### RF-04 — Visualización social (Comunidad)

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| P-19 | Ver lista de miembros | Ir a la sección "Comunidad". | Se muestra la lista de otros usuarios con su número de juegos. | Lista visible y correcta. | ✅ OK |
| P-20 | Ver perfil público de otro usuario | Pulsar sobre un miembro de la comunidad. | Se muestra su colección completa en modo solo lectura (sin botones de editar/borrar). | Perfil visible sin controles de edición. | ✅ OK |
| P-21 | Acceso a comunidad sin login | Intentar acceder a `/community` directamente sin token. | El servidor devuelve 401 y el frontend redirige al login. | Acceso bloqueado correctamente. | ✅ OK |

---

### RF-05 — Estadísticas comunitarias

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| P-22 | Ver estadísticas globales | Ir a la sección "Comunidad" > pestaña de estadísticas. | Se muestra el ranking de juegos por nota media, con número de votos. | Estadísticas calculadas correctamente vía SQL `AVG + GROUP BY`. | ✅ OK |
| P-23 | Nota media con múltiples votos | Dos usuarios puntúan el mismo juego (ej. 8 y 6). | La nota media mostrada es 7.00. | Cálculo correcto. | ✅ OK |

---

### RF-06 — Administración

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| P-24 | Acceso al panel admin como usuario normal | Intentar acceder a `/admin` con una cuenta sin rol admin. | El servidor devuelve 403 Forbidden. El frontend no muestra el enlace al panel. | Acceso bloqueado correctamente. | ✅ OK |
| P-25 | Listar usuarios como admin | Iniciar sesión con cuenta admin. Ir a "/admin". | Se muestra la tabla completa de usuarios con email y fecha de registro. | Lista visible con todos los datos. | ✅ OK |
| P-26 | Eliminar cuenta de otro usuario | Pulsar "Eliminar" en la fila de un usuario en el panel admin. | El usuario queda eliminado y sus juegos se borran en cascada (ON DELETE CASCADE). | Eliminación correcta, colección del usuario desaparece. | ✅ OK |
| P-27 | El admin no puede eliminarse a sí mismo | Intentar eliminar la propia cuenta desde el panel admin. | Error: "No puedes eliminar tu propia cuenta desde el panel". | Operación bloqueada correctamente. | ✅ OK |

---

### Comentarios (funcionalidad extra)

| ID | Caso de prueba | Pasos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| P-28 | Añadir comentario en una ficha | Abrir el hilo de comentarios de un juego. Escribir un mensaje y enviar. | El comentario aparece en el hilo con el nombre del autor y la fecha. | Comentario publicado correctamente. | ✅ OK |
| P-29 | Eliminar propio comentario | Pulsar el botón de eliminar sobre un comentario propio. | El comentario desaparece del hilo. | Eliminado correctamente. | ✅ OK |
| P-30 | Un usuario no puede eliminar el comentario de otro | Intentar borrar un comentario ajeno (vía API directa con Thunder Client). | El servidor devuelve 403 Forbidden. | Acceso bloqueado correctamente. | ✅ OK |

---

## Pruebas de seguridad básicas

| ID | Caso de prueba | Herramienta | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| S-01 | Acceso a ruta protegida sin token | Thunder Client: `GET /api/games` sin cabecera Authorization. | 401 Unauthorized. | `{"error":"Token no proporcionado o formato inválido."}` | ✅ OK |
| S-02 | Token manipulado | Enviar una petición con un JWT modificado manualmente. | 401 Unauthorized: "Token inválido o expirado". | Rechazado correctamente. | ✅ OK |
| S-03 | Intentar leer los juegos de otro usuario por ID | `GET /api/games/99` con token de usuario A, siendo el juego 99 del usuario B. | 404 Not Found (el filtro `usuario_id` no encuentra la fila). | No se devuelven datos ajenos. | ✅ OK |
| S-04 | Acceso a panel admin sin rol admin | `GET /api/admin/users` con token de usuario normal. | 403 Forbidden. | `{"error":"Se requieren permisos de administrador."}` | ✅ OK |
| S-05 | `/api/test-db` en producción | Simular `NODE_ENV=production` y llamar al endpoint. | 404 Not Found (endpoint ocultado). | Respuesta 404 correcta. | ✅ OK |
| S-06 | Registro con payload gigante (> 50 kb) | Enviar un body de más de 50 kb al endpoint de registro. | 413 Payload Too Large (límite de `express.json`). | Rechazado con 413. | ✅ OK |

---

## Pruebas de validación de datos

| ID | Caso de prueba | Entrada | Resultado esperado | Estado |
|---|---|---|---|---|
| V-01 | Email con mayúsculas y espacios | `"  Usuario@GMAIL.com  "` | Se normaliza a `"usuario@gmail.com"` antes de guardar. | ✅ OK |
| V-02 | Título con espacios múltiples | `"The  Witcher   3"` | Se normaliza a `"The Witcher 3"` (función `normalizeGameTitle`). | ✅ OK |
| V-03 | Estado en inglés (`Completed`) | Enviar `estado: "Completed"` desde un cliente externo. | Se guarda como `"Completado"` en BD (función `normalizeEstadoForDb`). | ✅ OK |
| V-04 | Plataforma vacía | No enviar campo `plataforma`. | Se guarda `"PC"` como valor por defecto (`normalizePlataforma`). | ✅ OK |

---

## Resumen

| Categoría | Total | Pasadas | Fallidas |
|---|---|---|---|
| Funcionales (RF-01 a RF-06) | 27 | 27 | 0 |
| Seguridad | 6 | 6 | 0 |
| Validación | 4 | 4 | 0 |
| **Total** | **37** | **37** | **0** |

---

## Mejoras pendientes identificadas durante las pruebas

1. **Sin limitación de intentos de login** (*rate limiting*): actualmente es posible hacer fuerza bruta sobre el endpoint `/api/auth/login`. En una versión de producción se añadiría un middleware como `express-rate-limit`.
2. **Mensajes de error en producción**: aunque el middleware global ya oculta los detalles técnicos cuando `NODE_ENV=production`, las rutas individuales que llaman directamente a `res.json({ error: error.message })` deberían usar el patrón `next(error)` para pasar siempre por el manejador centralizado.
3. **Fusión automática de fichas duplicadas**: el flujo `merge_duplicate` que aparece en la edición de juegos no es intuitivo para el usuario. La mejora sería detectar el caso automáticamente y fusionar sin preguntar cuando ambas fichas corresponden al mismo `catalogo_id`.
