const express = require('express');
const router = express.Router();
const contratoController = require('../controller/contratoController');
const reporteController = require('../controller/reporteController');

const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const { validarContrato } = require('../validations/contratoValidation');

// Diagrama 2: crear contrato e inventario (Contratista)
router.post('/nuevo', verificarToken, verificarRol('Contratista'), validarContrato, contratoController.crearContrato);

// RF-005: consultar mis solicitudes (Contratista)
router.get('/mis-solicitudes', verificarToken, verificarRol('Contratista'), contratoController.misSolicitudes);

// RF-010: descargar PDF (Contratista dueño / Admin)
router.get('/:id/pdf', verificarToken, verificarRol('Contratista', 'Administrador'), reporteController.descargarPdf);

// RF-014: consultar observaciones del trámite
router.get('/:id/observaciones', verificarToken, contratoController.obtenerObservaciones);

// RF-003: eliminar un bien del inventario (Contratista, en Borrador)
router.delete('/:id/bienes/:bienId', verificarToken, verificarRol('Contratista'), contratoController.eliminarBien);

// Listar contratos por rol (Supervisor / Admin / ResponsableArea)
router.get('/', verificarToken, verificarRol('Supervisor', 'Administrador', 'ResponsableArea'), contratoController.listarContratos);

// RF-002: cancelar contrato en Borrador
router.delete('/:id', verificarToken, verificarRol('Contratista'), contratoController.cancelarContrato);

// Obtener detalle y actualizar (RF-002)
router.get('/:id', verificarToken, contratoController.obtenerContrato);
router.put('/:id', verificarToken, verificarRol('Contratista'), contratoController.actualizarContrato);

module.exports = router;
