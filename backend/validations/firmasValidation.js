const { body } = require('express-validator');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada del dictamen de área (Flujo 4)
const validarFirma = [
  body('contratoId').isMongoId().withMessage('contratoId debe ser un ObjectId válido.'),
  body('accion').isIn(['Aprobar', 'Rechazar']).withMessage('La acción debe ser "Aprobar" o "Rechazar".'),
  validarCampos,
];

module.exports = { validarFirma };
