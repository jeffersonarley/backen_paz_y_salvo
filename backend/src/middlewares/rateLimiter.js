const rateLimit = require('express-rate-limit');

const creadorLimite = (opciones) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    ...opciones
  });

const apiLimiter = creadorLimite({
  max: Number(process.env.API_RATE_LIMIT_MAX) || 200,
  message: { mensaje: 'Demasiadas peticiones. Intente de nuevo más tarde.' }
});

const authLimiter = creadorLimite({
  max: Number(process.env.RATE_LIMIT_MAX) || 10,
  message: { mensaje: 'Demasiados intentos. Intente de nuevo más tarde.' }
});

module.exports = { apiLimiter, authLimiter };