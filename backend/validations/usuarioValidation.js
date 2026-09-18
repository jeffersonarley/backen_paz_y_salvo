const { body } = require('express-validator');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada para la creación de usuarios
const validarUsuario = [
  body('nombre_completo').trim().notEmpty().withMessage('El nombre completo es obligatorio.'),
  body('correo_institucional').isEmail().withMessage('Correo institucional inválido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  body('rol').isIn(['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista']).withMessage('Rol inválido.'),
  validarCampos,
];

module.exports = { validarUsuario };
