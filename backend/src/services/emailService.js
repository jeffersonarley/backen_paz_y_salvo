const nodemailer = require('nodemailer');

// Transport reutilizable (antes se creaba uno nuevo por cada correo)
let transporter = null;

const obtenerTransport = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

// Enviar un correo de forma segura (no rompe el flujo si falla el envío).
// Devuelve { ok, error } para que quien llama pueda registrar el fallo.
const enviarCorreo = async ({ to, subject, text, attachments = [] }) => {
  const transport = obtenerTransport();
  if (!transport) {
    return { ok: false, error: 'EMAIL_USER/EMAIL_PASS no configurados.' };
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments
    });
    return { ok: true };
  } catch (error) {
    console.error('Error enviando correo:', error.message);
    return { ok: false, error: error.message };
  }
};

module.exports = { enviarCorreo };
