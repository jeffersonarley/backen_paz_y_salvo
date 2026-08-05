const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contratoController');

// 1. Importar desestructurando las dos funciones del middleware
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// 2. Proteger la ruta: Primero verifica el Token, luego el Rol 'Contratista'
router.post('/nuevo', verificarToken, verificarRol('Contratista'), contratoController.crearContrato);

module.exports = router;