const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const firmasController = require('../controllers/firmasController');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada del dictamen de área (Flujo 4)
const validarFirma = [
  body('contratoId').isString().bail().isMongoId().withMessage('contratoId debe ser un ObjectId válido.'),
  body('accion').isIn(['Aprobar', 'Rechazar']).withMessage('La acción debe ser "Aprobar" o "Rechazar".'),
  body('observacion_rechazo').optional({ nullable: true }).isString().withMessage('La observación debe ser texto.'),
  body('firma_base64').optional({ nullable: true }).isString().withMessage('La firma debe enviarse como cadena base64.'),
  validarCampos
];

// Verificación pública por hash (SHA-256/HMAC en hexadecimal: 64 caracteres)
const validarHash = [
  param('hash').matches(/^[a-f0-9]{64}$/).withMessage('Hash de verificación inválido.'),
  validarCampos
];

// Verificar la autenticidad de una firma (público: sirve para validar un PDF impreso)
router.get('/verificar/:hash', validarHash, firmasController.verificarFirma);

// Diagrama 4: procesar aprobación/rechazo de un área
router.post('/procesar', verificarToken, verificarRol('ResponsableArea', 'Administrador'), validarFirma, firmasController.procesarFirma);

// RF-013: listar solicitudes pendientes y historial
router.get('/pendientes', verificarToken, verificarRol('ResponsableArea', 'Administrador'), firmasController.listarPendientes);
router.get('/historial', verificarToken, verificarRol('ResponsableArea', 'Administrador'), firmasController.listarHistorial);

module.exports = router;
