const { body } = require('express-validator');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada del login
const validarLogin = [
  body('correo_institucional').isEmail().withMessage('Correo institucional inválido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validarCampos,
];

module.exports = { validarLogin };
