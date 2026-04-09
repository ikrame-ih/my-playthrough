# Plan de pruebas — MyPlaythrough

**Proyecto:** MyPlaythrough  
**Alumna:** Ikrame Ibn Hayoun  
**Ciclo:** Desarrollo de Aplicaciones Web — CESUR Málaga Este  
**Curso:** 2025/2026 · Entrega final (cuarta entrega)

**Sobre este fichero:** es la **fuente en texto** del plan de pruebas en el repositorio. La versión maquetada para navegador (mismo contenido) está en **`docs/plan_pruebas.html`** (imprimir / PDF desde el navegador). Para **GitHub o el IDE**, este Markdown basta (vista previa en VS Code: `Ctrl+Shift+V`). Si entregas en Aula Virtual, puedes copiar ese HTML o un PDF generado a tu carpeta **`material_entrega/`** (no se sube al repositorio).

---

## 1. Finalidad y alcance

Este documento describe **qué se ha probado**, **cómo** y **con qué resultado** en la aplicación MyPlaythrough. Incluye pruebas **manuales** (interfaz y API con Thunder Client) y **unitarias automáticas** (Vitest), sin sustituir la revisión funcional completa del código en el repositorio.

---

## 2. Tipos de prueba realizadas

| Tipo | Descripción breve |
|------|-------------------|
| Manuales funcionales | Comprobación de flujos de usuario (registro, colección, comunidad, admin, comentarios). |
| Seguridad básica | Acceso a rutas protegidas sin token, permisos, límites de cuerpo, endpoint de diagnóstico en producción. |
| Validación de datos | Normalización de entradas (email, título, estado, plataforma) coherente con el backend. |
| Unitarias automáticas | Tests repetibles sobre lógica pura (sin navegador ni base de datos), ejecutados con Vitest 3. |

---

## 3. Entorno de prueba

| Parámetro | Valor |
|-----------|--------|
| Sistema operativo | Windows 11 |
| Navegador | Google Chrome 124 |
| Backend | Node.js 20, Express 5, puerto 3000 |
| Frontend | Vite, React 18, puerto 5173 |
| Base de datos | PostgreSQL 16 (local o contenedor Docker) |
| Cliente API | Thunder Client (extensión de VS Code) |

---

## 4. Pruebas automáticas unitarias (Vitest)

Se ejecutan en terminal, desde la carpeta de cada paquete, **sin** levantar obligatoriamente Docker ni PostgreSQL para los tests del `normalize` y utilidades del cliente.

| Ubicación | Comando | Ficheros / ámbito |
|-----------|---------|-------------------|
| Backend (`server/`) | `npm test` | `server/utils/normalize.js` (email, título, plataforma, estado, referencia catálogo, payload de error según `NODE_ENV`). |
| Frontend (`client/`) | `npm test` | `gameLabels.js`, `coverUrl.js`. |

- Modo vigilancia (opcional): `npm run test:watch` en `server` o `client`.
- **Herramienta:** Vitest 3 (compatible con Vite en el cliente y con Node en el servidor).

**Relación con validación manual:** los casos V-01 a V-04 del apartado 8 están alineados con la lógica probada en `normalize.js`.

---

## 5. Pruebas manuales funcionales

### 5.1. RF-01 — Gestión de usuarios (autenticación)

| ID | Caso | Pasos (resumen) | Esperado | Obtenido | Estado |
|----|------|-----------------|----------|----------|--------|
| P-01 | Registro válido | Login → Crear cuenta → datos válidos → Registrarse | Redirección al dashboard; JWT en `localStorage` | Colección vacía visible; sesión iniciada | OK |
| P-02 | Email duplicado | Registrar de nuevo el mismo email | Error claro; no duplicado | Mensaje de error mostrado | OK |
| P-03 | Contraseña corta | Contraseña de menos de 6 caracteres | Validación; no se envía | Mensaje en formulario | OK |
| P-04 | Login correcto | Email y contraseña válidos | JWT y acceso al dashboard | Dashboard accesible | OK |
| P-05 | Contraseña incorrecta | Email válido, contraseña errónea | 401; sin acceso | Error mostrado | OK |
| P-06 | Email inexistente | Email no registrado | 401; mensaje coherente | Error mostrado | OK |
| P-07 | Cerrar sesión | Botón en sidebar | Token eliminado; pantalla de login | Logout correcto | OK |
| P-08 | Sesión tras F5 | Recargar estando logueada | Sesión mantenida | Mantiene autenticación | OK |
| P-08b | Avatar de perfil | Ajustes → Perfil → elegir otro robot | `PATCH /api/auth/me` correcto; avatar en barra, comunidad y comentarios | Cambio visible tras guardar | OK |
| P-08c | Avatar inválido (API) | Thunder Client: `PATCH /api/auth/me` con `avatar_id` no listado | 400 | Rechazado | OK |

### 5.2. RF-02 — Biblioteca (CRUD)

| ID | Caso | Pasos (resumen) | Esperado | Obtenido | Estado |
|----|------|-----------------|----------|----------|--------|
| P-09 | Añadir manual | Añadir juego con título, estado, plataforma | Aparece en la colección | Visible en dashboard | OK |
| P-10 | Añadir con buscador | Búsqueda → elegir resultado → guardar | Carátula desde CDN | Imagen y ficha correctas | OK |
| P-11 | Duplicado | Mismo título que uno existente | Error; no duplicar | Mensaje; una sola ficha | OK |
| P-12 | Sin título | Guardar con título vacío | Validación | Error en formulario | OK |
| P-13 | Editar estado | Detalle → cambiar estado → guardar | Estado actualizado | Correcto | OK |
| P-14 | Editar nota y horas | Cambiar puntuación y horas | Valores persistidos | Correcto | OK |
| P-15 | Eliminar | Eliminar y confirmar | Desaparece de la colección | Eliminado | OK |
| P-16 | Filtro por estado | Filtro "Completados" en sidebar | Solo completados | Filtro correcto | OK |

### 5.3. RF-03 — Edición de detalles

| ID | Caso | Pasos | Esperado | Obtenido | Estado |
|----|------|-------|----------|----------|--------|
| P-17 | Nota fuera de rango | Valor > 10 | Bloqueo o aviso en UI | `max=10` en formulario | OK |
| P-18 | Horas negativas | Introducir horas negativas | Normalización a 0 en servidor | Guardado 0 en BD | OK |

### 5.4. RF-04 — Comunidad

| ID | Caso | Pasos | Esperado | Obtenido | Estado |
|----|------|-------|----------|----------|--------|
| P-19 | Lista de miembros | Entrar en Comunidad | Lista con número de juegos | Correcta | OK |
| P-20 | Perfil ajeno | Clic en miembro | Colección ajena solo lectura | Sin edición | OK |
| P-21 | Sin token | Acceder a `/community` sin sesión | 401; redirección a login | Bloqueado | OK |

### 5.5. RF-05 — Estadísticas

| ID | Caso | Pasos | Esperado | Obtenido | Estado |
|----|------|-------|----------|----------|--------|
| P-22 | Ranking global | Comunidad → estadísticas | Media y número de votos | Cálculo SQL correcto | OK |
| P-23 | Media con dos votos | Mismo juego puntuado por dos usuarios | Media aritmética correcta | Ej.: 8 y 6 → 7,00 | OK |

### 5.6. RF-06 — Administración

| ID | Caso | Pasos | Esperado | Obtenido | Estado |
|----|------|-------|----------|----------|--------|
| P-24 | Usuario normal en `/admin` | Acceso sin rol admin | 403; sin enlace en UI | Bloqueado | OK |
| P-25 | Listado admin | Admin → panel | Tabla de usuarios | Datos visibles | OK |
| P-26 | Borrar otro usuario | Eliminar fila de otro usuario | Usuario y juegos en cascada | Correcto | OK |
| P-27 | No auto-borrado | Admin intenta borrarse a sí misma | Error controlado | Operación bloqueada | OK |

### 5.7. Comentarios en ficha de juego

| ID | Caso | Pasos | Esperado | Obtenido | Estado |
|----|------|-------|----------|----------|--------|
| P-28 | Publicar comentario | Abrir hilo → enviar texto | Comentario con autor y fecha | Publicado | OK |
| P-29 | Borrar propio | Eliminar comentario propio | Desaparece del hilo | Eliminado correctamente | OK |
| P-30 | Borrar ajeno (API) | Thunder Client: borrar comentario de otra persona | 403 | Bloqueado | OK |

---

## 6. Pruebas de seguridad (API / configuración)

| ID | Caso | Herramienta / condición | Esperado | Obtenido | Estado |
|----|------|-------------------------|----------|----------|--------|
| S-01 | Sin token | `GET /api/games` sin `Authorization` | 401 | JSON de error coherente | OK |
| S-02 | JWT alterado | Token modificado a mano | 401 | Rechazado | OK |
| S-03 | Juego de otro usuario | `GET /api/games/:id` con juego de otro `usuario_id` | 404 | Sin datos ajenos | OK |
| S-04 | Admin sin rol | `GET /api/admin/users` con JWT de usuario | 403 | Mensaje de permisos | OK |
| S-05 | test-db en producción | `NODE_ENV=production` y `GET /api/test-db` | 404 | Endpoint oculto | OK |
| S-06 | Body > 50 KB | Registro con payload grande | 413 | Rechazado | OK |

---

## 7. Validación de datos (coherencia con backend)

| ID | Caso | Entrada / acción | Esperado | Estado |
|----|------|------------------|----------|--------|
| V-01 | Email | `"  Usuario@GMAIL.com  "` | Normalizado a `usuario@gmail.com` | OK |
| V-02 | Título | `"The  Witcher   3"` | `"The Witcher 3"` (`normalizeGameTitle`) | OK |
| V-03 | Estado en inglés | `estado: "Completed"` | Guardado como `Completado` | OK |
| V-04 | Plataforma vacía | Sin campo `plataforma` | Por defecto `PC` | OK |

---

## 8. Resumen numérico

**Comprobación del recuento (por ID):**

- **P-01 … P-30** → **30** casos (autenticación, biblioteca, comunidad, estadísticas, administración y comentarios en ficha).
- **S-01 … S-06** → **6** casos (seguridad API / configuración).
- **V-01 … V-04** → **4** casos (validación de datos coherente con el backend).

**Suma manual: 30 + 6 + 4 = 40.**  
*(En borradores anteriores a veces se citaba **37** al sumar solo los casos agrupados en RF-01…RF-06 **sin** los tres casos de comentarios **P-28…P-30**, más seguridad y validación: 27 + 6 + 4 = 37. Este documento usa el inventario completo por identificador P/S/V.)*

| Categoría | Total | Pasadas | Fallidas |
|-----------|-------|---------|----------|
| Flujo de aplicación (P-01 … P-30) | 30 | 30 | 0 |
| Seguridad API / configuración (S-01 … S-06) | 6 | 6 | 0 |
| Validación de datos (V-01 … V-04) | 4 | 4 | 0 |
| **Total pruebas manuales** | **40** | **40** | **0** |
| Unitarias automáticas (Vitest) | 22 | 22 | 0 |

*Las 22 pruebas unitarias corresponden a 14 tests en `server` (`npm test` en `server/`) y 8 en `client` (`npm test` en `client/`).*

---

## 9. Mejoras detectadas durante las pruebas (líneas futuras)

1. **Intentos de login:** no hay límite de reintentos; en producción convendría *rate limiting* (p. ej. `express-rate-limit`).
2. **Errores en producción:** unificar el envío de errores hacia `next(error)` para que todo pase por el manejador central y no se filtre `error.message` en rutas sueltas.
3. **Duplicados de ficha:** el flujo de fusión de duplicados en edición puede simplificarse cuando ambas fichas comparten el mismo `catalogo_id`.
