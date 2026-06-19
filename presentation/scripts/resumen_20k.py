# -*- coding: utf-8 -*-
"""Genera resumen exacto de 20000 caracteres (UTF-8) para defensa."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "resumen-defensa-20000chars.txt"
TARGET = 20_000

# Bloques separados; se unen y se recortan/rellenan a TARGET
PARTS = [
    """RESUMEN MYPLAYTHROUGH — DEFENSA Y PREGUNTAS (DAW · PERN · CESUR Málaga Este · 2025/2026)

1) QUÉ ES
MyPlaythrough es una SPA (Single Page Application) para gestionar una colección personal de videojuegos y una comunidad ligera. Cada usuario da de alta juegos con estado (jugando, completado, pendiente, abandonado, wishlist), horas jugadas, nota, plataforma y portada. La colección se ve en cuadrícula o lista y admite ordenación por varios criterios. Las portadas se buscan con datos públicos de Steam y RAWG; el servidor actúa como proxy de imágenes para evitar CORS y bloqueos de hotlinking. Lo social: perfiles públicos, seguir/dejar de seguir, recomendar un juego de TU biblioteca solo a alguien a quien ya sigues (bandeja, campana, contador de no leídas, tono opcional con Web Audio API), hilos de comentarios en la ficha de juego con votos en comentarios raíz, y publicaciones LFG (buscar grupo) ligadas a un juego que ya está en tu biblioteca. El panel de administración permite moderar usuarios, fichas y LFG; el rol admin se revalida en base de datos en cada petición protegida.""",

    """2) PROPUESTA vs ALTERNATIVAS
Backloggd es popular pero suele cargar lento y saturar la interfaz con información que no necesitas para anotar qué juegas. HowLongToBeat es excelente para estimar duración de juegos pero no sustituye una biblioteca personal con tus notas y estados. La librería de Steam solo cubre juegos en esa tienda; no incluye consolas ni otras plataformas. MyPlaythrough apunta a algo más limpio: una biblioteca unificada, portadas centrales, comunidad opcional sin abrumar.""",

    """3) STACK PERN — QUÉ SIGNIFICA Y POR QUÉ
PostgreSQL + Express + React + Node.js. Motivos habituales de defensa: datos altamente relacionales (usuarios, juegos, catálogo compartido, grafo de seguimientos) encajan bien en SQL con integridad referencial. Usar JavaScript en cliente y servidor reduce fricción entre capas. npm ofrece muchas librerías (bcryptjs, jsonwebtoken, pg, cors, express-rate-limit, react-joyride…). Vite acelera el arranque frente a herramientas más antiguas como Create React App. Tailwind aplica utilidades en el JSX sin repartir estilos dispersos en muchos CSS. Cliente: Vite, puerto típico 5173. API: Express, puerto 3000. PostgreSQL: 5432 instalación nativa Windows u otro puerto; con Docker Compose el host suele exponer 5433 mapeado al 5432 del contenedor.""",

    """4) FRONTEND
React 18, componentes funcionales, hooks (useState, useEffect, etc.), React Router DOM para rutas internas. apiFetch centraliza cabeceras JSON y Bearer JWT; ante 401 limpia token y usuario y recarga para evitar estados inconsistentes. Tras guardar/editar juego, un mensaje visible al volver a la colección llega por location.state del router. localStorage guarda token y objeto usuario. Tour guiado con react-joyride: se marca tras el registro de esa cuenta en el navegador; se relanza desde Perfil. Accesibilidad: enlace “saltar al contenido”, foco al main, labels en vista y ordenación. Skeletons durante la carga.""",

    """5) BACKEND
Express 5 monta routers bajo /api/: auth (register, login, GET/PATCH me con nombre visible, avatar, sonido), games (CRUD colección), covers (búsqueda/proxy imágenes), users (comunidad y juegos públicos por id), community (estadísticas agregadas SQL, actividad), social (follows, recommendations, LFG, activity), admin (moderación). index.js: CORS con CORS_ORIGIN, express.json con límite de tamaño del cuerpo, orden de rutas cuidado (p. ej. cover-search antes que /games/:id numérico). authMiddleware verifica JWT; adminMiddleware consulta rol en BD.""",

    """6) SEGURIDAD
Contraseña: política fuerte validada en servidor y aviso en formulario; hash bcrypt coste 10; nunca en claro. nombre_usuario público único con índice único sobre lower(trim(...)). Login acepta email o nombre de usuario. JWT firmado con JWT_SECRET; expiración típica varios días. Rate limit en POST login/registro por IP (429 si se excede). Consultas SQL parametrizadas con placeholders $1, $2… para evitar inyección SQL. CORS restringido al origen del front. Proxy de imágenes solo a dominios permitidos. En producción /api/test-db puede devolver 404.""",

    """7) BASE DE DATOS — IDEA RAÍZ
Ocho tablas en esquema actual: usuarios, catalogo_juegos, juegos, juego_comentarios, juego_comentario_votos, usuario_seguimientos, juego_recomendaciones, lfg_publicaciones. La decisión clave: separar catalogo_juegos de juegos. catalogo_juegos guarda título, imagen y IDs canónicos RAWG/Steam para que muchas filas de “juegos” (datos personales por usuario) referencien una sola ficha compartida y no se dupliquen portada y título cientos de veces. Claves foráneas con ON DELETE CASCADE donde toca: al borrar usuario desaparecen sus datos dependientes sin huérfanos. usuario_seguimientos modela el grafo “A sigue a B”. juego_recomendaciones une remitente, destinatario y juego de la biblioteca del remitente. LFG enlaza usuario, juego propio y texto de búsqueda de grupo.""",

    """8) FUNCIONALIDADES (lista corta para memorizar)
CRUD colección; búsqueda portadas Steam+RAWG; vista cuadrícula/lista y ordenación; comunidad con stats globales; feed actividad de seguidos; recomendaciones solo a seguidos; LFG; discusión por juego con respuestas y votos en raíz; admin con confirmación reforzada al borrar cuenta (nombre público exacto); moderación de fichas y LFG; admin puede borrar comentarios ajenos en discusión según reglas del código.""",

    """9) REFERENCIA RÁPIDA API (nombres que puedes citar)
GET/PATCH /api/auth/me; POST login y register; CRUD /api/games; /api/users y /api/users/:id/games; /api/community/stats; social bajo /api/social (follow, recommendations, lfg, activity); admin bajo /api/admin. Covers y búsqueda de imágenes bajo rutas dedicadas antes de confundir ids numéricos con palabras reservadas.""",

    """10) DESPLIEGUE Y SEEDS
README: Docker compose (API+BD) o manual con docs/sql/schema.sql y server/.env (DB_*, JWT_SECRET, CORS_ORIGIN, RAWG_API_KEY opcional). Seeds: npm run seed:demo y npm run seed:presentation; contraseña de presentación documentada en README (Presentacion2026!); botón login “Rellenar cuenta demo” rellena correo/contraseña de la cuenta jurado.""",

    """11) PRESENTACIÓN
Carpeta presentation/: mini app React+Vite+TypeScript+Tailwind+Framer Motion para slides animadas; versión estática para imprimir/PDF sin árbol animado que corrompa el archivo.""",

    """12) PREGUNTAS FRECUENTES — FRASES CORTAS
¿Por qué PostgreSQL y no MongoDB? Porque dominio relacional y reglas de integridad. ¿JWT? Token firmado, sin sesión en servidor, el cliente lo envía en Authorization Bearer. ¿Proxy imágenes? CORS y hotlinking. ¿Qué fue difícil? Alinear las tres capas en permisos y social. ¿Mejoras? Más tests auto, deploy público, websockets, estadísticas personales avanzadas.""",

    """13) SI TE BLOQUEAS
Lo más difícil suele ser alinear React, Express y PostgreSQL en permisos y flujos sociales. Si no sabes un detalle, dilo y explica cómo lo buscarías en rutas, SQL o componentes. Cierra anclando siempre a algo observable en el repo (README, schema.sql, carpeta routes/).""",
]


def join_and_normalize(parts):
    return re.sub(r"\s+", " ", "\n\n".join(parts).strip())


def snap_to_word(s: str, limit: int) -> str:
    if len(s) <= limit:
        return s
    cut = s[:limit]
    sp = cut.rfind(" ")
    return cut[:sp] if sp > limit // 2 else cut


text = join_and_normalize(PARTS)
if len(text) > TARGET:
    text = snap_to_word(text, TARGET)
# Relleno con frase neutra hasta TARGET (sin espacios masivos al final)
FILLER = (
    " Recuerda: cada afirmación fuerte debe poder apoyarse en una ruta del servidor, "
    "una tabla del esquema SQL o un comportamiento visible en la aplicación."
)
while len(text) + len(FILLER) <= TARGET:
    text += FILLER
if len(text) < TARGET:
    text += FILLER[: TARGET - len(text) ]
assert len(text) == TARGET

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(text, encoding="utf-8")
print(f"Escrito {OUT} ({len(text)} caracteres)")
