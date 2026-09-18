const Contrato = require('../models/Contrato');
const BienEntregado = require('../models/BienEntregado');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const { generarPdf } = require('../services/pdfService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// RF-010: Generar y descargar el PDF oficial GCCON-F-088
exports.descargarPdf = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const rol = req.usuario?.rol;
    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;

    if (rol !== 'Administrador' && String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (contrato.estado !== 'Finalizado') {
        throw new AppError('El trámite aún no ha finalizado. No se puede generar el PDF.', 400);
    }

    const bienes = await BienEntregado.find({ contrato_id: contrato._id });
    const firmas = await TrazabilidadFirma.find({ contrato_id: contrato._id }).populate('area_id', 'nombre_dependencia');

    const filepath = await generarPdf({ contrato, bienes, firmas, firma_base64: null });

    return res.download(filepath, `pazysalvo_${contrato.numero_contrato}.pdf`);
});
