const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const dependenciaController = require('../controllers/dependenciaController');

// RF-012: gestión de dependencias y responsables de área (Supervisor)
router.post('/', verificarToken, verificarRol('Supervisor'), dependenciaController.crearDependencia);
router.get('/', verificarToken, verificarRol('Supervisor', 'Administrador'), dependenciaController.obtenerDependencias);
router.put('/:id', verificarToken, verificarRol('Supervisor'), dependenciaController.actualizarDependencia);
router.post('/:id/responsable', verificarToken, verificarRol('Supervisor'), dependenciaController.asignarResponsable);

module.exports = router;
