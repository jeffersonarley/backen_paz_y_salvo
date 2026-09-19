const app = require('../backend/src/app');
const conectarDB = require('../backend/src/config/db');

conectarDB();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ EMAIL_USER/EMAIL_PASS no configurados: los correos (recuperación y notificaciones) fallarán silenciosamente.');
}

module.exports = app;