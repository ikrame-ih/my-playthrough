const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Configuración básica
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Backend funcionando correctamente! ');
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});