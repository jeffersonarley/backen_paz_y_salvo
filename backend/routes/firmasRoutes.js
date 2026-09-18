const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const firmasController = require('../controller/firmasController');
const { validarFirma } = require('../validations/firmasValidation');

// Diagrama 4: procesar aprobación/rechazo de un área
router.post('/procesar', verificarToken, verificarRol('ResponsableArea', 'Administrador'), validarFirma, firmasController.procesarFirma);

// RF-013: listar solicitudes pendientes y historial
router.get('/pendientes', verificarToken, verificarRol('ResponsableArea', 'Administrador'), firmasController.listarPendientes);
router.get('/historial', verificarToken, verificarRol('ResponsableArea', 'Administrador'), firmasController.listarHistorial);

module.exports = router;
