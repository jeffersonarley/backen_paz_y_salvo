const express = require('express');
const router = express.Router();
const supervisionController = require('../controllers/supervisionController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Endpoint del Diagrama 3 (Supervisor asignado o Administrador)
router.put('/evaluar/:id', verificarToken, verificarRol('Supervisor', 'Administrador'), supervisionController.evaluarContrato);

module.exports = router;