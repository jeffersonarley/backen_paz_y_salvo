const mongoose = require('mongoose');
const Contrato = require('../models/Contrato');
const DependenciaArea = require('../models/DependenciaArea');
const Usuario = require('../models/Usuario');
const { registrar } = require('../services/auditoriaService');
const {
    construirFilas,
    obtenerDependenciasConResponsables,
    obtenerPlantillaContrato,
    TEMPLATAS,
} = require('../services/plantillaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const usuarioIdActual = (req) => req.usuario?.id;

// Lista las filas del formato con las dependencias reales y sus responsables
exports.obtenerFilasDisponibles = asyncHandler(async (req, res) => {
    const dependencias = await obtenerDependenciasConResponsables();

    const supervisorId = req.usuario?.id;
    const supervisor = req.usuario?.rol === 'Supervisor'
        ? await Usuario.findById(supervisorId)
        : null;
    const apoyoSupervision = supervisor?.apoyo_supervision_id
        ? await Usuario.findById(supervisor.apoyo_supervision_id)
        : null;

    const filas = construirFilas({
        dependencias,
        tipoPlantilla: 'COMPLETA',
        supervisor,
        apoyoSupervision,
    });

    res.status(200).json({
        plantillas: Object.values(TEMPLATAS).map((t) => ({
            id: t.id,
            nombre: t.nombre,
            descripcion: t.descripcion,
            filasAplica: t.filasAplica,
        })),
        filas,
        dependencias: dependencias.map((dep) => ({
            id: dep._id,
            nombre: dep.nombre_dependencia,
            activo: dep.activo,
            responsables: (dep.responsables_ids || []).map((r) => ({
                id: r._id,
                nombre: r.nombre_completo,
                correo: r.correo_institucional,
                rol: r.rol,
            })),
        })),
    });
});

// Plantilla aplicada a un contrato (la elige el Supervisor/Coordinador)
exports.obtenerPlantilla = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const rol = req.usuario?.rol;
    const usuarioId = usuarioIdActual(req);

    if (rol === 'Contratista' && String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }
    if (rol === 'Supervisor' && String(contrato.supervisor) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. No estás asignado a este contrato.', 403);
    }
    if (!['Contratista', 'Supervisor', 'Administrador'].includes(rol)) {
        throw new AppError('Acceso denegado.', 403);
    }

    const plantilla = await obtenerPlantillaContrato(contrato);
    res.status(200).json(plantilla);
});

// El Supervisor (Coordinador) define la plantilla y los firmantes de un contrato
exports.actualizarPlantilla = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const rol = req.usuario?.rol;
    const usuarioId = usuarioIdActual(req);

    if (rol === 'Supervisor' && String(contrato.supervisor) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. No estás asignado a este contrato.', 403);
    }
    if (!['Supervisor', 'Administrador'].includes(rol)) {
        throw new AppError('Acceso denegado. Solo el Supervisor o el Administrador puede configurar la plantilla.', 403);
    }

    const { plantilla_tipo, filas } = req.body;
    const tipo = typeof plantilla_tipo === 'string' ? plantilla_tipo.trim().toUpperCase() : '';
    if (tipo && !TEMPLATAS[tipo]) {
        throw new AppError('La plantilla indicada no existe.', 400);
    }

    const dependencias = await obtenerDependenciasConResponsables();

    // Firmantes manuales por fila: se validan contra los usuarios existentes
    const firmantesPorFila = Array.isArray(filas) ? filas : [];
    const filasNormalizadas = [];

    for (const fila of firmantesPorFila) {
        const idFila = Number(fila.id_fila ?? fila.id);
        if (!Number.isInteger(idFila)) continue;

        const responsablesIds = (fila.responsables || [])
            .map((r) => (typeof r === 'string' ? r : r?.id))
            .filter((id) => typeof id === 'string' && mongoose.isValidObjectId(id));

        const usuarios = responsablesIds.length
            ? await Usuario.find({ _id: { $in: responsablesIds } })
            : [];
        const nombres = usuarios.map((u) => u.nombre_completo);

        const dependencia = fila.dependencia_id
            ? dependencias.find((d) => String(d._id) === String(fila.dependencia_id))
            : null;

        filasNormalizadas.push({
            id_fila: idFila,
            dependencia_id: dependencia?._id || null,
            dependencia_nombre:
                dependencia?.nombre_dependencia || fila.dependencia_nombre || '',
            responsables: usuarios.map((u) => u._id),
            nombres: nombres.length ? nombres : Array.isArray(fila.nombres) ? fila.nombres : [],
            aplica: fila.aplica !== false,
            marca: fila.aplica !== false ? 'X' : 'N/A',
        });
    }

    if (tipo) contrato.plantilla_tipo = tipo;
    if (filasNormalizadas.length) contrato.plantilla_firmantes = filasNormalizadas;

    await contrato.save();

    await registrar({
        usuario_id: usuarioId,
        accion: 'ACTUALIZAR_PLANTILLA_CONTRATO',
        entidad_afectada: 'contratos_gccon_f088',
        detalles: {
            contrato_id: contrato._id,
            plantilla_tipo: contrato.plantilla_tipo,
            filas: filasNormalizadas.length,
        },
    });

    const plantilla = await obtenerPlantillaContrato(contrato);
    res.status(200).json({
        mensaje: 'Plantilla y firmantes actualizados exitosamente.',
        ...plantilla,
    });
});

// Plantilla predeterminada del Supervisor (Coordinador)
exports.actualizarPlantillaPredeterminada = asyncHandler(async (req, res) => {
    const usuarioId = usuarioIdActual(req);
    const supervisor = await Usuario.findById(usuarioId);
    if (!supervisor) {
        throw new AppError('Usuario no encontrado.', 404);
    }

    const tipo = String(req.body.plantilla_tipo || '').trim().toUpperCase();
    if (!TEMPLATAS[tipo]) {
        throw new AppError('La plantilla indicada no existe.', 400);
    }

    supervisor.plantilla_predeterminada = tipo;
    await supervisor.save();

    await registrar({
        usuario_id: usuarioId,
        accion: 'ACTUALIZAR_PLANTILLA_PREDETERMINADA',
        entidad_afectada: 'usuarios',
        detalles: { plantilla_tipo: tipo },
    });

    res.status(200).json({
        mensaje: 'Plantilla predeterminada actualizada exitosamente.',
        plantilla_tipo: tipo,
    });
});

// Dependencias con sus responsables (para el Constructor de Plantillas)
exports.listarDependenciasConResponsables = asyncHandler(async (req, res) => {
    const dependencias = await DependenciaArea.find()
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol')
        .sort({ nombre_dependencia: 1 });

    res.status(200).json(
        dependencias.map((dep) => ({
            id: dep._id,
            nombre: dep.nombre_dependencia,
            activo: dep.activo,
            responsable: dep.responsable_id
                ? {
                    id: dep.responsable_id._id,
                    nombre: dep.responsable_id.nombre_completo,
                    correo: dep.responsable_id.correo_institucional,
                    rol: dep.responsable_id.rol,
                }
                : null,
            responsables: (dep.responsables_ids || []).map((r) => ({
                id: r._id,
                nombre: r.nombre_completo,
                correo: r.correo_institucional,
                rol: r.rol,
            })),
        }))
    );
});
