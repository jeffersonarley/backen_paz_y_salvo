require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const { swaggerUi, swaggerDocument } = require('./config/swagger');

const Usuario = require('./models/Usuario');

const app = express();

// Middlewares de seguridad y utilidades
app.use(helmet());
app.use(morgan('dev'));

// CORS con lista blanca desde CORS_ORIGIN (separada por comas)
const origenesPermitidos = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origenesPermitidos.length === 0 || origenesPermitidos.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origen no permitido por CORS.'));
        }
    }
}));

app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API Paz y Salvo Contractual SENA activa 🚀' });
});

// Ruta de prueba para verificar Compass
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

// Rutas de Autenticación (Login)
app.use('/api/auth', require('./routes/authRoutes'));

// Rutas del Módulo de Usuarios
app.use('/api/usuarios', require('./routes/usuarioRoutes'));

// Rutas del Módulo de Contratos e Inventario (Diagrama 2)
app.use('/api/contratos', require('./routes/contratoRoutes'));

// Rutas del Módulo de Supervisión y Evaluación (Diagrama 3)
app.use('/api/contratos', require('./routes/supervisionRoutes'));

// Rutas del módulo de firmas (Diagrama 4)
app.use('/api/firmas', require('./routes/firmasRoutes'));

// Rutas del Módulo de Dependencias y Responsables (RF-012)
app.use('/api/dependencias', require('./routes/dependenciaRoutes'));

// Rutas del Módulo de Formato GCCON-F-088 (Diagrama 6 / RF-004)
app.use('/api/formatos', require('./routes/formatoRoutes'));

// Rutas del Módulo de Auditoría (RNF-003)
app.use('/api/auditoria', require('./routes/auditoriaRoutes'));

// 404 para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada.' });
});

// Manejador central de errores
app.use(errorHandler);

module.exports = app;
