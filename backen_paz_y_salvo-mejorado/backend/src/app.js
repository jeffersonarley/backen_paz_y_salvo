require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { swaggerUi, swaggerDocument } = require('./config/swagger');
const AppError = require('./utils/AppError');

const app = express();

// Detrás de un proxy (Vercel) hay que confiar en X-Forwarded-For; si no, el rate limit
// vería la IP del proxy para todos los clientes. Configurable con TRUST_PROXY (nº de saltos).
// Localmente (sin proxy) se deja en 0 para que nadie pueda falsear su IP.
const saltosProxy = process.env.TRUST_PROXY !== undefined
    ? Number(process.env.TRUST_PROXY)
    : (process.env.VERCEL ? 1 : 0);
if (saltosProxy > 0) {
    app.set('trust proxy', saltosProxy);
}

// Capa 1 — Seguridad HTTP con Helmet (cabeceras seguras)
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: null
        }
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 15552000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' },
    dnsPrefetchControl: { allow: false }
}));
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Capa 2 — Límite global de peticiones para toda la API (abuso/DoS)
app.use('/api', apiLimiter);

// CORS con lista blanca desde CORS_ORIGIN (separada por comas)
const origenesPermitidos = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
// En producción, si CORS_ORIGIN está vacío NO se aceptan orígenes de navegador (falla cerrado).
// En desarrollo/test una lista vacía permite cualquier origen para no estorbar.
const corsAbierto = process.env.NODE_ENV !== 'production' && origenesPermitidos.length === 0;
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || corsAbierto || origenesPermitidos.includes(origin)) {
            callback(null, true);
        } else {
            callback(new AppError('Origen no permitido por CORS.', 403));
        }
    }
}));

// 1 MB: suficiente para la imagen de firma (máx. 512 KB en base64) sin abrir la puerta a cuerpos enormes
app.use(express.json({ limit: '1mb' }));

// Documentación Swagger: pública en desarrollo; en producción solo si ENABLE_DOCS=true
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'API Paz y Salvo Contractual SENA activa 🚀' });
});

// Comprobación de salud (sin datos sensibles) para monitoreo/despliegue
app.get('/health', (req, res) => {
    res.json({ ok: true });
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
