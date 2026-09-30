const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const dependenciaController = require('../controllers/dependenciaController');

// RF-012: gestión de dependencias y responsables de área (Supervisor)
router.post('/', verificarToken, verificarRol('Supervisor'), dependenciaController.crearDependencia);
// Cualquier usuario autenticado puede consultar las dependencias (el Contratista las selecciona al crear un contrato)
router.get('/', verificarToken, dependenciaController.obtenerDependencias);
router.put('/:id', verificarToken, verificarRol('Supervisor'), dependenciaController.actualizarDependencia);
router.post('/:id/responsable', verificarToken, verificarRol('Supervisor'), dependenciaController.asignarResponsable);

// Toggle estado (activar/desactivar) - usado por frontend Paula
router.delete('/:id', verificarToken, verificarRol('Supervisor'), dependenciaController.toggleEstado);

module.exports = router;
