require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./src/config/db');

// 1. Importar los modelos
const Usuario = require('./src/models/Usuario');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
conectarDB();

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API Paz y Salvo Contractual SENA activa 🚀' });
});

// 2. Ruta de prueba para verificar Compass
app.get('/api/test-db', async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json({
            mensaje: "¡Conexión verificada con éxito desde VS Code! 🎉",
            total_usuarios: usuarios.length,
            datos_desde_compass: usuarios
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Rutas de Autenticación (Login)
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// 4. Rutas del Módulo de Usuarios
const usuarioRoutes = require('./src/routes/usuarioRoutes');
app.use('/api/usuarios', usuarioRoutes);

// 5. Rutas del Módulo de Contratos e Inventario (Diagrama 2)
const contratoRoutes = require('./src/routes/contratoRoutes');
app.use('/api/contratos', contratoRoutes);

// 6. Rutas del Módulo de Supervisión y Evaluación (Diagrama 3)
const supervisionRoutes = require('./src/routes/supervisionRoutes');
app.use('/api/contratos', supervisionRoutes);

// Rutas para el módulo de firmas (Diagrama 4)
const firmasRoutes = require('./src/routes/firmasRoutes');
app.use('/api/firmas', firmasRoutes);

// Arrancar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});