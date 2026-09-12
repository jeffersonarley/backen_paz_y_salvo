const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

const { verificarToken, verificarRol, verificarJerarquia } = require('../middlewares/authMiddleware');
const validarCampos = require('../middlewares/validarCampos');

// Validación de entrada para la creación de usuarios
const validarUsuario = [
  body('nombre_completo').trim().notEmpty().withMessage('El nombre completo es obligatorio.'),
  body('correo_institucional').isEmail().withMessage('Correo institucional inválido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  body('rol').isIn(['Administrador', 'Supervisor', 'ResponsableArea', 'Contratista']).withMessage('Rol inválido.'),
  validarCampos
];

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
