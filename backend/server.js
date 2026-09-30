const { validarEntorno } = require('./src/config/env');
const app = require('./src/app');
const conectarDB = require('./src/config/db');

// Falla rápido si faltan JWT_SECRET o MONGODB_URI (no hay valores por defecto)
try {
    validarEntorno();
} catch (error) {
    console.error('❌ Configuración inválida:', error.message);
    process.exit(1);
}

// Aviso si las credenciales de correo no están configuradas
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ EMAIL_USER/EMAIL_PASS no configurados: los correos (recuperación y notificaciones) no se enviarán.');
}

// Conectar a la base de datos y arrancar el servidor
const PORT = process.env.PORT || 3000;
conectarDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        process.exit(1);
    });
