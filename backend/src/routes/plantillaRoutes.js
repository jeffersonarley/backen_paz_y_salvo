const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const plantillaController = require('../controllers/plantillaController');

// Módulo de plantillas GCCON-F-088: el Supervisor (Coordinador) define la plantilla
// que aplica a sus contratos y el Contratista solo puede consultarla.
router.get('/filas', verificarToken, plantillaController.obtenerFilasDisponibles);
router.get('/dependencias', verificarToken, plantillaController.listarDependenciasConResponsables);
router.put(
    '/predeterminada',
    verificarToken,
    verificarRol('Supervisor', 'Administrador'),
    plantillaController.actualizarPlantillaPredeterminada
);

module.exports = router;
