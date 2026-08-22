require('dotenv').config();
const app = require('./src/app');
const conectarDB = require('./src/config/db');

// Conectar a la base de datos
conectarDB();

// Aviso si las credenciales de correo no están configuradas
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ EMAIL_USER/EMAIL_PASS no configurados: los correos (recuperación y notificaciones) fallarán silenciosamente.');
}

// Arrancar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
