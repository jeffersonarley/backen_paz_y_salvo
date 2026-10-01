const Contrato = require('../models/Contrato');
const DependenciaArea = require('../models/DependenciaArea');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const { enviarCorreo } = require('../services/emailService');
const { registrar } = require('../services/auditoriaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Estados en los que el supervisor puede evaluar (o re-evaluar tras una corrección / rechazo de área).
// Un contrato ya en firma o finalizado NO se puede evaluar de nuevo.
const ESTADOS_EVALUABLES = ['Borrador', 'EnProceso', 'Rechazado'];
const ESTADOS_RECHAZABLES = [...ESTADOS_EVALUABLES, 'Pendiente de Firmas'];

// Diagrama 3: Validación del Supervisor y apertura de firmas
exports.evaluarContrato = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { aprobado, observaciones_supervisor } = req.body;

    const esAdministrador = req.usuario.rol === 'Administrador';
    if (!['Supervisor', 'Administrador'].includes(req.usuario.rol)) {
        throw new AppError('Acceso denegado. Se requiere rol de Supervisor o Administrador.', 403);
    }

    if (typeof aprobado !== 'boolean') {
        throw new AppError('El campo "aprobado" debe ser true o false.', 400);
    }

    const contrato = await Contrato.findById(id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    if (!contrato.supervisor && !esAdministrador) {
        throw new AppError('Acceso denegado. Este contrato no tiene un supervisor asignado.', 403);
    }

    const usuarioId = req.usuario.id;
    if (!esAdministrador && contrato.supervisor.toString() !== usuarioId) {
        throw new AppError('Acceso denegado. No estás asignado como supervisor de este contrato.', 403);
    }

    const estadosPermitidos = aprobado ? ESTADOS_EVALUABLES : ESTADOS_RECHAZABLES;
    if (!estadosPermitidos.includes(contrato.estado)) {
        throw new AppError(`El contrato no se puede evaluar en estado "${contrato.estado}".`, 409);
    }

    const estadoPrevio = contrato.estado;

    if (aprobado === false) {
        // --- RECHAZADO ---
        const observaciones = typeof observaciones_supervisor === 'string' && observaciones_supervisor.trim()
            ? observaciones_supervisor.trim().slice(0, 1000)
            : 'Rechazado por el supervisor.';

        // Transición atómica: solo si el contrato sigue en un estado evaluable
        const actualizado = await Contrato.findOneAndUpdate(
            { _id: contrato._id, estado: { $in: ESTADOS_RECHAZABLES } },
            { $set: { estado: 'Borrador', observaciones_supervisor: observaciones } },
            { returnDocument: 'after' }
        );
        if (!actualizado) {
            throw new AppError('El contrato cambió de estado mientras se evaluaba. Recargue e intente de nuevo.', 409);
        }

        if (estadoPrevio === 'Pendiente de Firmas') {
            await TrazabilidadFirma.updateMany(
                { contrato_id: contrato._id, estado: 'Pendiente' },
                { $set: { estado: 'Cancelado' } }
            );
        }

        const correo = await enviarCorreo({
            to: actualizado.correo_contratista,
            subject: `Paz y Salvo Rechazado - Contrato ${actualizado.numero_contrato}`,
            text: `Estimado(a) ${actualizado.nombre_contratista},\n\nSu paz y salvo requiere observaciones:\n"${observaciones}"`
        });

        await registrar({
            usuario_id: usuarioId,
            accion: 'RECHAZAR_CONTRATO',
            entidad_afectada: 'contratos_gccon_f088',
            detalles: { contrato_id: actualizado._id, observaciones_supervisor: observaciones, correo_enviado: correo.ok }
        });

        return res.status(200).json({
            mensaje: 'Contrato rechazado exitosamente. Retornado a estado Borrador.',
            contrato: actualizado
        });
    }

    // --- APROBADO ---
    const areasActivas = await DependenciaArea.find({ activo: true });
    if (areasActivas.length === 0) {
        // Sin áreas no habría quién firme y el contrato quedaría "Pendiente de Firmas" para siempre
        throw new AppError('No hay dependencias activas para abrir las firmas. Cree o active al menos una.', 409);
    }

    const actualizado = await Contrato.findOneAndUpdate(
        { _id: contrato._id, estado: { $in: ESTADOS_EVALUABLES } },
        { $set: { estado: 'Pendiente de Firmas' } },
        { returnDocument: 'after' }
    );
    if (!actualizado) {
        throw new AppError('El contrato cambió de estado mientras se evaluaba. Recargue e intente de nuevo.', 409);
    }

    try {
        // Si el contrato vuelve a aprobarse tras una corrección, se limpian los casilleros anteriores
        // (antes se duplicaban). La trazabilidad de lo ocurrido queda en historial_auditoria.
        await TrazabilidadFirma.deleteMany({ contrato_id: contrato._id });

        await TrazabilidadFirma.insertMany(areasActivas.map(area => ({
            contrato_id: contrato._id,
            area_id: area._id,
            estado: 'Pendiente',
            hash_verificacion: ''
        })));
    } catch (error) {
        // Compensación: si no se pudieron abrir las firmas, el contrato vuelve a su estado anterior
        await Contrato.updateOne({ _id: contrato._id }, { $set: { estado: estadoPrevio } }).catch(() => {});
        throw error;
    }

    await registrar({
        usuario_id: usuarioId,
        accion: 'APROBAR_CONTRATO',
        entidad_afectada: 'contratos_gccon_f088',
        detalles: { contrato_id: actualizado._id, casilleros_abiertos: areasActivas.length }
    });

    return res.status(200).json({
        mensaje: 'Contrato aprobado por el supervisor. Firma de áreas aperturada.',
        contrato: actualizado
    });
});
