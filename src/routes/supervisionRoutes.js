const express = require('express');
const router = express.Router();
const supervisionController = require('../controllers/supervisionController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint del Diagrama 3
router.put('/evaluar/:id', verificarToken, supervisionController.evaluarContrato);

module.exports = router;