# Dockerfile del servidor (Node.js + Express)
#
# Usamos la imagen oficial de Node en su versión "slim" (Alpine-based).
# "slim" es más ligera que la imagen completa porque no incluye herramientas
# de desarrollo que no necesitamos en producción (compiladores, etc.).

FROM node:20-slim

# Definimos el directorio de trabajo dentro del contenedor.
# Todos los comandos RUN, COPY y CMD que siguen se ejecutan desde aquí.
WORKDIR /app

# Copiamos primero solo los ficheros de dependencias para aprovechar
# la caché de capas de Docker: si el código cambia pero package.json no,
# Docker reutiliza la capa de npm install sin volver a descargar nada.
COPY package*.json ./

# Instalamos solo las dependencias de producción (sin devDependencies).
# --omit=dev excluye nodemon y otras herramientas que no se necesitan en el contenedor.
RUN npm install --omit=dev

# Copiamos el resto del código fuente.
COPY . .

# Exponemos el puerto en el que Express escucha.
# Esto es solo documentación para quien lea el Dockerfile;
# el puerto real se mapea en docker-compose.yml.
EXPOSE 3000

# Comando que se ejecuta al arrancar el contenedor.
# Usamos node directamente (no nodemon) porque en producción
# no necesitamos reinicio automático al guardar ficheros.
CMD ["node", "index.js"]
