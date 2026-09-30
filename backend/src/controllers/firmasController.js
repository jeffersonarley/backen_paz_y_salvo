const mongoose = require('mongoose');
const Contrato = require('../models/Contrato');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const BienEntregado = require('../models/BienEntregado');
const { enviarCorreo } = require('../services/emailService');
const { generarPdf } = require('../services/pdfService');
const { registrar } = require('../services/auditoriaService');
const { decodificarFirma } = require('../utils/firma');
const { generarHashFirma, hashCoincide } = require('../utils/firmaHash');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const ACCIONES = { aprobar: 'Aprobar', rechazar: 'Rechazar' };

// Diagrama 4: Dictamen de área, sello criptográfico y motor PDF
exports.procesarFirma = asyncHandler(async (req, res) => {
    const { contratoId, accion, firma_base64, observacion_rechazo } = req.body;

    if (typeof contratoId !== 'string' || !mongoose.isValidObjectId(contratoId) || typeof accion !== 'string') {
        throw new AppError('Faltan campos obligatorios: contratoId o accion.', 400);
    }

    const accionNormalizada = ACCIONES[accion.trim().toLowerCase()];
    if (!accionNormalizada) {
        throw new AppError('Acción no reconocida. Use "Aprobar" o "Rechazar".', 400);
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

    // Solo se puede firmar mientras el trámite espera firmas. Esto impide, por ejemplo,
    // seguir aprobando un contrato que otra área ya rechazó.
    if (contrato.estado !== 'Pendiente de Firmas') {
        throw new AppError(`El contrato no está pendiente de firmas (estado actual: ${contrato.estado}).`, 409);
    }

    const traz = await TrazabilidadFirma.findOne({ contrato_id: contrato._id, area_id: areaId });
    if (!traz) {
        throw new AppError('No existe un registro de firma para esta área y contrato.', 400);
    }

    if (traz.estado !== 'Pendiente') {
        throw new AppError(`Esta área ya realizó su acción: ${traz.estado}`, 400);
    }

    const usuarioId = req.usuario.id;

    // ---------------- RECHAZO ----------------
    if (accionNormalizada === 'Rechazar') {
        const observacion = typeof observacion_rechazo === 'string' ? observacion_rechazo.trim() : '';
        if (!observacion) {
            throw new AppError('Debe indicar una observación al rechazar.', 400);
        }
        if (observacion.length > 1000) {
            throw new AppError('La observación no puede superar 1000 caracteres.', 400);
        }

        // Cambio atómico: solo prospera si el casillero sigue Pendiente
        const rechazada = await TrazabilidadFirma.findOneAndUpdate(
            { _id: traz._id, estado: 'Pendiente' },
            { $set: { estado: 'Rechazado', observacion_rechazo: observacion, usuario_id: usuarioId, fecha_firma: new Date() } },
            { returnDocument: 'after' }
        );
        if (!rechazada) {
            throw new AppError('Esta área ya realizó su acción.', 409);
        }

        // Un solo rechazo detiene todo el trámite: el contrato pasa a "Rechazado"
        // y ya no puede finalizarse aunque las demás áreas aprueben.
        await Contrato.updateOne(
            { _id: contrato._id, estado: 'Pendiente de Firmas' },
            { $set: { estado: 'Rechazado' } }
        );

        const correo = await enviarCorreo({
            to: contrato.correo_contratista,
            subject: `Paz y Salvo Rechazado - Contrato ${contrato.numero_contrato}`,
            text: `Su trámite fue rechazado por el área. Motivo: ${observacion}`
        });

        await registrar({
            usuario_id: usuarioId,
            accion: 'RECHAZAR_FIRMA',
            entidad_afectada: 'trazabilidad_firmas',
            detalles: { contrato_id: contrato._id, area_id: areaId, observacion_rechazo: observacion, correo_enviado: correo.ok }
        });

        const contratoActual = await Contrato.findById(contrato._id);
        return res.status(200).json({ mensaje: 'Firma procesada: Rechazado', contrato: contratoActual });
    }

    // ---------------- APROBACIÓN ----------------
    // La imagen de firma se valida ANTES de cambiar cualquier estado (formato PNG/JPEG y tamaño)
    const firmaImagen = firma_base64 ? decodificarFirma(firma_base64) : null;

    const bienes = await BienEntregado.find({ contrato_id: contrato._id });
    const fechaFirma = new Date();
    const hash = generarHashFirma({
        contrato,
        bienes,
        area_id: areaId,
        usuario_id: usuarioId,
        fecha_firma: fechaFirma
    });

    // Cambio atómico: si dos peticiones llegan a la vez, solo una aprueba el casillero
    const aprobada = await TrazabilidadFirma.findOneAndUpdate(
        { _id: traz._id, estado: 'Pendiente' },
        { $set: { estado: 'Aprobado', usuario_id: usuarioId, fecha_firma: fechaFirma, hash_verificacion: hash } },
        { returnDocument: 'after' }
    );
    if (!aprobada) {
        throw new AppError('Esta área ya realizó su acción.', 409);
    }

    await registrar({
        usuario_id: usuarioId,
        accion: 'APROBAR_FIRMA',
        entidad_afectada: 'trazabilidad_firmas',
        detalles: { contrato_id: contrato._id, area_id: areaId, hash_verificacion: hash }
    });

    // El contrato solo se finaliza cuando TODAS las firmas están aprobadas
    const noAprobadas = await TrazabilidadFirma.countDocuments({ contrato_id: contrato._id, estado: { $ne: 'Aprobado' } });
    if (noAprobadas > 0) {
        const pendientes = await TrazabilidadFirma.countDocuments({ contrato_id: contrato._id, estado: 'Pendiente' });
        return res.status(200).json({ mensaje: 'Firma aprobada. Aún quedan firmas pendientes.', pendientes });
    }

    // Transición atómica a Finalizado: si dos áreas firman a la vez, solo UNA genera PDF y correo
    const finalizado = await Contrato.findOneAndUpdate(
        { _id: contrato._id, estado: 'Pendiente de Firmas' },
        { $set: { estado: 'Finalizado' } },
        { returnDocument: 'after' }
    ).populate('dependencia', 'nombre_dependencia');

    if (!finalizado) {
        return res.status(200).json({ mensaje: 'Firma aprobada.', pendientes: 0 });
    }

    const firmas = await TrazabilidadFirma.find({ contrato_id: contrato._id }).populate('area_id', 'nombre_dependencia');
    const pdf = await generarPdf({ contrato: finalizado, bienes, firmas, firma: firmaImagen });

    const correo = await enviarCorreo({
        to: finalizado.correo_contratista,
        subject: `Paz y Salvo Finalizado - Contrato ${finalizado.numero_contrato}`,
        text: 'Su paz y salvo ha finalizado. Adjunto encontrará el documento.',
        attachments: [{ filename: `pazysalvo_${finalizado._id}.pdf`, content: pdf, contentType: 'application/pdf' }]
    });

    await registrar({
        usuario_id: usuarioId,
        accion: 'FINALIZAR_CONTRATO',
        entidad_afectada: 'contratos_gccon_f088',
        detalles: { contrato_id: finalizado._id, correo_enviado: correo.ok }
    });

    return res.status(200).json({
        mensaje: 'Contrato finalizado, PDF generado y notificación enviada.',
        contrato: finalizado,
        correo_enviado: correo.ok
    });
});

// Verificación pública de una firma por su hash (p. ej. para validar un PDF impreso).
// Recalcula el HMAC con el contenido actual: si el contrato o el inventario cambiaron
// después de firmar, el hash deja de coincidir y la firma se reporta como NO válida.
exports.verificarFirma = asyncHandler(async (req, res) => {
    const { hash } = req.params;

    const traz = await TrazabilidadFirma.findOne({ hash_verificacion: hash, estado: 'Aprobado' })
        .populate('area_id', 'nombre_dependencia');
    if (!traz) {
        return res.status(404).json({ valido: false, mensaje: 'No existe una firma con ese hash.' });
    }

    const contrato = await Contrato.findById(traz.contrato_id);
    if (!contrato) {
        return res.status(404).json({ valido: false, mensaje: 'El contrato asociado ya no existe.' });
    }

    const bienes = await BienEntregado.find({ contrato_id: contrato._id });
    const recalculado = generarHashFirma({
        contrato,
        bienes,
        area_id: traz.area_id?._id || traz.area_id,
        usuario_id: traz.usuario_id,
        fecha_firma: traz.fecha_firma
    });

    const valido = hashCoincide(hash, recalculado);

    // Solo datos mínimos: sin correos, teléfonos ni identificadores internos
    return res.status(200).json({
        valido,
        mensaje: valido ? 'La firma es auténtica y el contenido no ha sido alterado.' : 'El contenido del contrato cambió después de la firma.',
        numero_contrato: contrato.numero_contrato,
        area: traz.area_id?.nombre_dependencia || null,
        fecha_firma: traz.fecha_firma,
        estado_contrato: contrato.estado
    });
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
