const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const validarCampos = require('../middlewares/validarCampos');

// Protección contra fuerza bruta (Flujo 1 + rate limiting por IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: Number(process.env.RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos. Intente de nuevo más tarde.' }
});

// Validación de entrada del login
const validarLogin = [
  body('correo_institucional').isEmail().withMessage('Correo institucional inválido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validarCampos
];

// Ruta pública de Login
router.post('/login', loginLimiter, validarLogin, authController.login);

// Flujo 5: Recuperación y restablecimiento de contraseña
router.post('/recuperar', loginLimiter, authController.recuperar);
router.post('/restablecer', authController.restablecer);

// RF-015: Cambio de contraseña (autenticado)
router.put('/cambiar-password', verificarToken, authController.cambiarPassword);

module.exports = router;
