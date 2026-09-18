const Contrato = require('../models/Contrato');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const BienEntregado = require('../models/BienEntregado');
const crypto = require('crypto');
const { enviarCorreo } = require('../services/emailService');
const { generarPdf } = require('../services/pdfService');
const { registrar } = require('../services/auditoriaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Diagrama 4: Dictamen de área, criptografía y motor PDF
exports.procesarFirma = asyncHandler(async (req, res) => {
    const { contratoId, accion, firma_base64, observacion_rechazo } = req.body;

    if (!contratoId || !accion) {
        throw new AppError('Faltan campos obligatorios: contratoId o accion.', 400);
    }

    const rol = req.usuario?.rol;
    if (!['ResponsableArea', 'Administrador'].includes(rol)) {
        throw new AppError('Acceso denegado. Se requiere rol ResponsableArea o Administrador.', 403);
    }

    const contrato = await Contrato.findById(contratoId);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const areaId = req.usuario?.dependencia_id;
    if (!areaId) {
        throw new AppError('No se pudo identificar el área del usuario.', 403);
    }

    const traz = await TrazabilidadFirma.findOne({ contrato_id: contrato._id, area_id: areaId });
    if (!traz) {
        throw new AppError('No existe un registro de firma para esta área y contrato.', 400);
    }

    if (traz.estado !== 'Pendiente') {
        throw new AppError(`Esta área ya realizó su acción: ${traz.estado}`, 400);
    }

    const usuarioId = req.usuario.id || req.usuario._id || req.usuario.uid;

    // Manejar rechazo
    if (accion === 'Rechazar' || accion === 'rechazar' || accion === 'RECHAZAR') {
        if (!observacion_rechazo) {
            throw new AppError('Debe indicar una observación al rechazar.', 400);
        }

        traz.estado = 'Rechazado';
        traz.observacion_rechazo = observacion_rechazo;
        traz.usuario_id = usuarioId;
        traz.fecha_firma = new Date();
        await traz.save();

        await enviarCorreo({
            to: contrato.correo_contratista,
            subject: `Paz y Salvo Rechazado - Contrato ${contrato.numero_contrato}`,
            text: `Su trámite fue rechazado por el área. Motivo: ${traz.observacion_rechazo}`
        });

        await registrar({
            usuario_id: usuarioId,
            accion: 'RECHAZAR_FIRMA',
            entidad_afectada: 'trazabilidad_firmas',
            detalles: { contrato_id: contrato._id, area_id: areaId, observacion_rechazo }
        });

        return res.status(200).json({ mensaje: 'Firma procesada: Rechazado', contrato });
    }

    // Manejar aprobación
    if (accion === 'Aprobar' || accion === 'aprobar' || accion === 'APROBAR') {
        const hash = crypto.createHash('sha256')
            .update(`${contrato._id}:${usuarioId}:${Date.now()}`)
            .digest('hex');

        traz.estado = 'Aprobado';
        traz.usuario_id = usuarioId;
        traz.fecha_firma = new Date();
        traz.hash_verificacion = hash;
        await traz.save();

        await registrar({
            usuario_id: usuarioId,
            accion: 'APROBAR_FIRMA',
            entidad_afectada: 'trazabilidad_firmas',
            detalles: { contrato_id: contrato._id, area_id: areaId, hash_verificacion: hash }
        });

        const pendientes = await TrazabilidadFirma.countDocuments({ contrato_id: contrato._id, estado: 'Pendiente' });

        if (pendientes > 0) {
            return res.status(200).json({ mensaje: 'Firma aprobada. Aún quedan firmas pendientes.', pendientes });
        }

        contrato.estado = 'Finalizado';
        await contrato.save();

        const bienes = await BienEntregado.find({ contrato_id: contrato._id });
        const firmas = await TrazabilidadFirma.find({ contrato_id: contrato._id }).populate('area_id', 'nombre_dependencia');

        const filepath = await generarPdf({
            contrato,
            bienes,
            firmas,
            firma_base64: firma_base64 || null
        });

        await enviarCorreo({
            to: contrato.correo_contratista,
            subject: `Paz y Salvo Finalizado - Contrato ${contrato.numero_contrato}`,
            text: `Su paz y salvo ha finalizado. Adjunto encontrará el documento.`,
            attachments: [{ filename: `pazysalvo_${contrato._id}.pdf`, path: filepath }]
        });

        await registrar({
            usuario_id: usuarioId,
            accion: 'FINALIZAR_CONTRATO',
            entidad_afectada: 'contratos_gccon_f088',
            detalles: { contrato_id: contrato._id, pdf_path: filepath }
        });

        return res.status(200).json({ mensaje: 'Contrato finalizado, PDF generado y notificación enviada.', pdf_path: filepath });
    }

    throw new AppError('Acción no reconocida. Use "Aprobar" o "Rechazar".', 400);
});

// RF-013: Listar solicitudes de firma pendientes asignadas al responsable de área
exports.listarPendientes = asyncHandler(async (req, res) => {
    const rol = req.usuario?.rol;
    const filtro = { estado: 'Pendiente' };

    if (rol !== 'Administrador') {
        if (!req.usuario?.dependencia_id) {
            throw new AppError('No se pudo identificar el área del usuario.', 403);
        }
        filtro.area_id = req.usuario.dependencia_id;
    }

    const pendientes = await TrazabilidadFirma.find(filtro)
        .populate({ path: 'contrato_id', model: 'Contrato' })
        .populate({ path: 'area_id', model: 'DependenciaArea' });

    res.status(200).json(pendientes);
});

// RF-013: Listar historial de solicitudes ya gestionadas por el responsable de área
exports.listarHistorial = asyncHandler(async (req, res) => {
    const rol = req.usuario?.rol;
    const filtro = { estado: { $ne: 'Pendiente' } };

    if (rol !== 'Administrador') {
        if (!req.usuario?.dependencia_id) {
            throw new AppError('No se pudo identificar el área del usuario.', 403);
        }
        filtro.area_id = req.usuario.dependencia_id;
    }

    const historial = await TrazabilidadFirma.find(filtro)
        .populate({ path: 'contrato_id', model: 'Contrato' })
        .populate({ path: 'area_id', model: 'DependenciaArea' });

    res.status(200).json(historial);
});
