const AppError = require('../utils/AppError');

// Manejador central de errores
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Error de validación de express-validator / mongoose
  if (error.name === 'ValidationError') {
    const mensaje = Object.values(error.errors).map(e => e.message).join('. ');
    error = new AppError(mensaje, 400);
  }

  // ID de Mongo con formato inválido (ej: /api/contratos/abc123)
  if (error.name === 'CastError') {
    error = new AppError(`Identificador inválido: ${error.value}`, 400);
  }

  // Llave duplicada (índice único de Mongo)
  if (error.code === 11000) {
    error = new AppError('Registro duplicado: el valor ya existe en el sistema.', 400);
  }

  // JSON mal formado en el body de la petición (express.json())
  if (error.type === 'entity.parse.failed' || error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    error = new AppError('El cuerpo de la petición no es un JSON válido.', 400);
  }

  // Token JWT inválido o expirado (por si algún flujo no lo captura antes)
  if (error.name === 'JsonWebTokenError') {
    error = new AppError('Token no válido.', 401);
  }
  if (error.name === 'TokenExpiredError') {
    error = new AppError('El token ha expirado. Inicie sesión de nuevo.', 401);
  }

  const statusCode = error.statusCode || 500;
  const mensaje = error.isOperational ? error.message : 'Error interno del servidor.';

  if (statusCode === 500) {
    console.error('Error no controlado:', error);
  }

  return res.status(statusCode).json({ mensaje });
};

module.exports = errorHandler;
