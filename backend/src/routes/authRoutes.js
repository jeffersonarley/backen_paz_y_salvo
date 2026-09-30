const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const validarCampos = require('../middlewares/validarCampos');

// Los campos deben ser TEXTO (isString): evita inyección NoSQL con objetos como { "$ne": null }
const validarLogin = [
  body('correo_institucional').isString().withMessage('Correo institucional inválido.').bail().isEmail().withMessage('Correo institucional inválido.'),
  body('password').isString().withMessage('La contraseña es obligatoria.').bail().notEmpty().withMessage('La contraseña es obligatoria.'),
  validarCampos
];

const validarRecuperar = [
  body('correo_institucional').isString().withMessage('Correo institucional inválido.').bail().isEmail().withMessage('Correo institucional inválido.'),
  validarCampos
];

const validarRestablecer = [
  body('token').isString().withMessage('Token inválido.').bail().isLength({ min: 1, max: 256 }).withMessage('Token inválido.'),
  body('nueva_password').isString().withMessage('La nueva contraseña es obligatoria.').bail().isLength({ min: 1, max: 128 }).withMessage('La contraseña no puede superar 128 caracteres.'),
  validarCampos
];

const validarCambioPassword = [
  body('password_actual').isString().withMessage('Debe indicar la contraseña actual.').bail().isLength({ min: 1, max: 128 }).withMessage('Contraseña actual inválida.'),
  body('nueva_password').isString().withMessage('Debe indicar la nueva contraseña.').bail().isLength({ min: 1, max: 128 }).withMessage('La contraseña no puede superar 128 caracteres.'),
  validarCampos
];

// Ruta pública de Login (protegida contra fuerza bruta)
router.post('/login', authLimiter, validarLogin, authController.login);

// Flujo 5: Recuperación y restablecimiento de contraseña
router.post('/recuperar', authLimiter, validarRecuperar, authController.recuperar);
router.post('/restablecer', authLimiter, validarRestablecer, authController.restablecer);

// RF-015: Cambio de contraseña (autenticado)
router.put('/cambiar-password', verificarToken, authLimiter, validarCambioPassword, authController.cambiarPassword);

module.exports = router;
