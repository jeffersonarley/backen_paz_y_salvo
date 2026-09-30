const { validarEntorno } = require('../backend/src/config/env');
const app = require('../backend/src/app');
const conectarDB = require('../backend/src/config/db');

// Falla con un mensaje claro en los logs de Vercel si falta configuración
validarEntorno();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ EMAIL_USER/EMAIL_PASS no configurados: los correos no se enviarán.');
}

// Handler serverless: asegura la conexión (reutilizada entre invocaciones) antes de atender la petición
module.exports = async (req, res) => {
    try {
        await conectarDB();
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        return res.status(503).json({ mensaje: 'Servicio no disponible. Intente de nuevo en unos instantes.' });
    }
    return app(req, res);
};
