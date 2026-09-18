const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuarioController');

const { verificarToken, verificarRol, verificarJerarquia } = require('../middlewares/authMiddleware');
const { validarUsuario } = require('../validations/usuarioValidation');

// Crear usuario respetando la cadena jerárquica (Admin crea Supervisores; Supervisor crea Contratistas/Responsables)
router.post('/', verificarToken, verificarRol('Administrador', 'Supervisor'), verificarJerarquia, validarUsuario, usuarioController.crearUsuario);

// Listar usuarios (Admin: todos; Supervisor: solo los suyos)
router.get('/', verificarToken, verificarRol('Administrador', 'Supervisor'), usuarioController.obtenerUsuarios);

// Flujo 7: habilitar/deshabilitar cuenta (Admin)
router.patch('/estado/:id', verificarToken, verificarRol('Administrador'), usuarioController.cambiarEstadoUsuario);

// Consultar y actualizar un usuario específico
router.get('/:id', verificarToken, verificarRol('Administrador', 'Supervisor'), usuarioController.obtenerUsuario);
router.patch('/:id', verificarToken, verificarRol('Administrador', 'Supervisor'), usuarioController.actualizarUsuario);

module.exports = router;
