const { body } = require('express-validator');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada del registro contractual (Flujo 2)
const validarContrato = [
  body('numero').trim().notEmpty().withMessage('El número de contrato es obligatorio.'),
  body('telefono').trim().notEmpty().withMessage('El teléfono es obligatorio.'),
  body('dependencia').isMongoId().withMessage('La dependencia debe ser un ObjectId válido.'),
  body('bienes').isArray({ min: 1 }).withMessage('Debe incluir al menos un bien.'),
  body('bienes.*.descripcion').trim().notEmpty().withMessage('Cada bien debe tener descripción.'),
  body('bienes.*.codigo_inventario').trim().notEmpty().withMessage('Cada bien debe tener código de inventario.'),
  validarCampos,
];

module.exports = { validarContrato };
