const express = require('express');
const router = express.Router();
const supervisionController = require('../controllers/supervisionController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Endpoint del Diagrama 3: solo el Supervisor (Coordinador) asignado evalúa el contrato
router.put('/evaluar/:id', verificarToken, verificarRol('Supervisor'), supervisionController.evaluarContrato);

module.exports = router;