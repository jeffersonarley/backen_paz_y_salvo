const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Importamos ambos middlewares
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// El Administrador y el Supervisor pueden crear usuarios
router.post('/', [verificarToken, verificarRol('Administrador', 'Supervisor')], usuarioController.crearUsuario);

// Solo el Administrador puede listar todos los usuarios
router.get('/', [verificarToken, verificarRol('Administrador')], usuarioController.obtenerUsuarios);

module.exports = router;