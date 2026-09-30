const Contrato = require('../models/Contrato');
const BienEntregado = require('../models/BienEntregado');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const { generarPdf } = require('../services/pdfService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// RF-010: Generar y descargar el PDF oficial GCCON-F-088 (se genera en memoria, sin archivos temporales)
exports.descargarPdf = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id).populate('dependencia', 'nombre_dependencia');
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const rol = req.usuario?.rol;
    const usuarioId = req.usuario?.id;

    if (rol !== 'Administrador' && String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (contrato.estado !== 'Finalizado') {
        throw new AppError('El trámite aún no ha finalizado. No se puede generar el PDF.', 400);
    }

    const bienes = await BienEntregado.find({ contrato_id: contrato._id });
    const firmas = await TrazabilidadFirma.find({ contrato_id: contrato._id }).populate('area_id', 'nombre_dependencia');

    const pdf = await generarPdf({ contrato, bienes, firmas, firma: null });

    // El número de contrato viene del usuario: se sanea para el nombre de archivo
    const nombreSeguro = String(contrato.numero_contrato).replace(/[^A-Za-z0-9._-]/g, '_');

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pazysalvo_${nombreSeguro}.pdf"`,
        'Content-Length': pdf.length
    });
    return res.send(pdf);
});
