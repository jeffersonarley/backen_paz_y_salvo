const express = require('express');
const router = express.Router();
const supervisionController = require('../controllers/supervisionController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Endpoint del Diagrama 3 (exclusivo Supervisor)
router.put('/evaluar/:id', verificarToken, verificarRol('Supervisor'), supervisionController.evaluarContrato);

module.exports = router;