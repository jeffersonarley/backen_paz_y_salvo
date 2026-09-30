const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const contratoController = require('../controllers/contratoController');
const reporteController = require('../controllers/reporteController');

const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const validarCampos = require('../middlewares/validarCampos');

// Fechas opcionales en formato ISO y coherentes entre sí
const validarFechas = [
  body('fecha_inicio').optional({ values: 'falsy' }).isISO8601().withMessage('La fecha de inicio no es válida.'),
  body('fecha_fin').optional({ values: 'falsy' }).isISO8601().withMessage('La fecha de fin no es válida.')
    .bail()
    .custom((fin, { req }) => {
      const inicio = req.body.fecha_inicio;
      return !inicio || new Date(fin) >= new Date(inicio);
    }).withMessage('La fecha de fin no puede ser anterior a la fecha de inicio.')
];

// Validación de entrada del registro contractual (Flujo 2)
// isString() evita que lleguen objetos donde se esperan textos.
const validarContrato = [
  body('numero').isString().withMessage('El número de contrato debe ser texto.').bail().trim().notEmpty().withMessage('El número de contrato es obligatorio.').isLength({ max: 100 }).withMessage('El número de contrato es demasiado largo.'),
  body('telefono').isString().withMessage('El teléfono debe ser texto.').bail().trim().notEmpty().withMessage('El teléfono es obligatorio.').isLength({ max: 30 }).withMessage('El teléfono es demasiado largo.'),
  body('dependencia').isString().withMessage('La dependencia debe ser texto.').bail().trim().notEmpty().withMessage('La dependencia es obligatoria.'),
  body('objeto_contractual').optional({ nullable: true }).isString().withMessage('El objeto contractual debe ser texto.').isLength({ max: 2000 }).withMessage('El objeto contractual es demasiado largo.'),
  ...validarFechas,
  body('bienes').isArray({ min: 1, max: 200 }).withMessage('Debe incluir entre 1 y 200 bienes.'),
  body('bienes.*.descripcion').isString().withMessage('La descripción de cada bien debe ser texto.').bail().trim().notEmpty().withMessage('Cada bien debe tener descripción.').isLength({ max: 500 }).withMessage('La descripción de un bien es demasiado larga.'),
  body('bienes.*.codigo_inventario').isString().withMessage('El código de cada bien debe ser texto.').bail().trim().notEmpty().withMessage('Cada bien debe tener código de inventario.').isLength({ max: 100 }).withMessage('El código de inventario es demasiado largo.'),
  body('bienes.*.cantidad').optional().isInt({ min: 1, max: 100000 }).withMessage('La cantidad de cada bien debe ser un entero mayor a 0.'),
  body('bienes.*.estado_bien').optional().isString().withMessage('El estado de cada bien debe ser texto.').isLength({ max: 100 }),
  validarCampos
];

// Validación de la actualización de un contrato en Borrador (RF-002)
const validarActualizacion = [
  body('numero').optional().isString().withMessage('El número de contrato debe ser texto.').bail().trim().notEmpty().withMessage('El número de contrato no puede estar vacío.').isLength({ max: 100 }),
  body('telefono').optional().isString().withMessage('El teléfono debe ser texto.').isLength({ max: 30 }),
  body('dependencia').optional().isString().withMessage('La dependencia debe ser texto.'),
  body('objeto_contractual').optional({ nullable: true }).isString().withMessage('El objeto contractual debe ser texto.').isLength({ max: 2000 }),
  ...validarFechas,
  validarCampos
];

// Diagrama 2: crear contrato e inventario (Contratista) - alias para compatibilidad con frontend Paula
router.post('/', verificarToken, verificarRol('Contratista'), validarContrato, contratoController.crearContrato);

// Diagrama 2: crear contrato e inventario (Contratista) - alias legado
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
router.put('/:id', verificarToken, verificarRol('Contratista'), validarActualizacion, contratoController.actualizarContrato);

module.exports = router;
