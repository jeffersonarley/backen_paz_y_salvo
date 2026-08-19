const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const firmasController = require('../controllers/firmasController');

router.post('/procesar', verificarToken, firmasController.procesarFirma);

module.exports = router;
