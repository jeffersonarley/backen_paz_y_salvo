const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada del login
const validarLogin = [
  body('correo_institucional').isEmail().withMessage('Correo institucional inválido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validarCampos
];

// Ruta pública de Login (protegida contra fuerza bruta)
router.post('/login', authLimiter, validarLogin, authController.login);

// Flujo 5: Recuperación y restablecimiento de contraseña
router.post('/recuperar', authLimiter, authController.recuperar);
router.post('/restablecer', authController.restablecer);

// RF-015: Cambio de contraseña (autenticado)
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

module.exports = router;
