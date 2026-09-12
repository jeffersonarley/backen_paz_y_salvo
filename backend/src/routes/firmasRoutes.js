const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const firmasController = require('../controllers/firmasController');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada del dictamen de área (Flujo 4)
const validarFirma = [
  body('contratoId').isMongoId().withMessage('contratoId debe ser un ObjectId válido.'),
  body('accion').isIn(['Aprobar', 'Rechazar']).withMessage('La acción debe ser "Aprobar" o "Rechazar".'),
  validarCampos
];

// Diagrama 4: procesar aprobación/rechazo de un área
router.post('/procesar', verificarToken, verificarRol('ResponsableArea', 'Administrador'), validarFirma, firmasController.procesarFirma);

// RF-013: listar solicitudes pendientes y historial
router.get('/pendientes', verificarToken, verificarRol('ResponsableArea', 'Administrador'), firmasController.listarPendientes);
router.get('/historial', verificarToken, verificarRol('ResponsableArea', 'Administrador'), firmasController.listarHistorial);

module.exports = router;
