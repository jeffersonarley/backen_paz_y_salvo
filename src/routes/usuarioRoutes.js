const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Importamos ambos middlewares
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Solo los Administradores pueden crear o listar usuarios
router.post('/', [verificarToken, verificarRol('Administrador')], usuarioController.crearUsuario);
router.get('/', [verificarToken, verificarRol('Administrador')], usuarioController.obtenerUsuarios);

module.exports = router;