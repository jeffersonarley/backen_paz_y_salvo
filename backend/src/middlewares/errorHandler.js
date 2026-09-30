const AppError = require('../utils/AppError');

// Manejador central de errores
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Error de validación de mongoose
  if (error.name === 'ValidationError' && error.errors) {
    const mensaje = Object.values(error.errors).map(e => e.message).join('. ');
    error = new AppError(mensaje, 400);
  }

  // Valor con tipo incorrecto (p. ej. un objeto donde se esperaba un texto o un ObjectId)
  if (error.name === 'CastError') {
    error = new AppError(`Valor inválido para el campo "${error.path}".`, 400);
  }

  if (error.code === 11000) {
    error = new AppError('Registro duplicado: el valor ya existe en el sistema.', 400);
  }

  // Errores 4xx de Express/body-parser (JSON mal formado, cuerpo demasiado grande, etc.)
  if (!error.isOperational && error.expose && error.statusCode >= 400 && error.statusCode < 500) {
    const mensajeCliente = error.type === 'entity.parse.failed'
      ? 'El cuerpo de la petición no es un JSON válido.'
      : error.type === 'entity.too.large'
        ? 'El cuerpo de la petición es demasiado grande.'
        : error.message;
    error = new AppError(mensajeCliente, error.statusCode);
  }

  const statusCode = error.statusCode || 500;
  const mensaje = error.isOperational ? error.message : 'Error interno del servidor.';

  if (statusCode === 500) {
    console.error('Error no controlado:', error);
  }

  return res.status(statusCode).json({ mensaje });
};

module.exports = errorHandler;
