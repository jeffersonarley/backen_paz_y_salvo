const mongoose = require('mongoose');
const DependenciaArea = require('../models/DependenciaArea');
const Usuario = require('../models/Usuario');
const { registrar } = require('../services/auditoriaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const usuarioIdActual = (req) => req.usuario?.id;

// RF-012: Crear dependencia (Supervisor)
exports.crearDependencia = asyncHandler(async (req, res) => {
    const { nombre_dependencia } = req.body;

    if (typeof nombre_dependencia !== 'string' || !nombre_dependencia.trim()) {
        throw new AppError('El nombre de la dependencia es obligatorio.', 400);
    }

    const existente = await DependenciaArea.findOne({ nombre_dependencia: nombre_dependencia.trim() });
    if (existente) {
        throw new AppError('La dependencia ya se encuentra creada.', 400);
    }

    const nueva = await DependenciaArea.create({ nombre_dependencia: nombre_dependencia.trim(), activo: true });

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: 'CREAR_DEPENDENCIA',
        entidad_afectada: 'dependencias_areas',
        detalles: { dependencia_id: nueva._id, nombre_dependencia }
    });

    res.status(201).json({ mensaje: 'Dependencia creada exitosamente.', dependencia: nueva });
});

// RF-012: Listar dependencias
exports.obtenerDependencias = asyncHandler(async (req, res) => {
    const dependencias = await DependenciaArea.find().populate('responsable_id', 'nombre_completo correo_institucional');
    res.status(200).json(dependencias);
});

// RF-012: Actualizar dependencia (nombre y/o estado activo)
exports.actualizarDependencia = asyncHandler(async (req, res) => {
    const dependencia = await DependenciaArea.findById(req.params.id);
    if (!dependencia) {
        throw new AppError('Dependencia no encontrada.', 404);
    }

    const { nombre_dependencia, activo } = req.body;
    if (nombre_dependencia !== undefined) {
        if (typeof nombre_dependencia !== 'string' || !nombre_dependencia.trim()) {
            throw new AppError('El nombre de la dependencia debe ser un texto no vacío.', 400);
        }
        dependencia.nombre_dependencia = nombre_dependencia.trim();
    }
    if (activo !== undefined) dependencia.activo = !!activo;

    await dependencia.save();

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: 'ACTUALIZAR_DEPENDENCIA',
        entidad_afectada: 'dependencias_areas',
        detalles: { dependencia_id: dependencia._id }
    });

    res.status(200).json({ mensaje: 'Dependencia actualizada exitosamente.', dependencia });
});

// RF-012: Asignar responsable de área a una dependencia
exports.asignarResponsable = asyncHandler(async (req, res) => {
    const dependencia = await DependenciaArea.findById(req.params.id);
    if (!dependencia) {
        throw new AppError('Dependencia no encontrada.', 404);
    }

    const { responsable_id } = req.body;
    if (typeof responsable_id !== 'string' || !mongoose.isValidObjectId(responsable_id)) {
        throw new AppError('Debe indicar un responsable_id válido.', 400);
    }

    const responsable = await Usuario.findById(responsable_id);
    if (!responsable) {
        throw new AppError('Responsable no encontrado.', 404);
    }

    if (responsable.rol !== 'ResponsableArea') {
        throw new AppError('El usuario asignado debe tener rol ResponsableArea.', 400);
    }

    // Limpieza de vínculos anteriores para no dejar dos responsables "activos" en una misma dependencia
    const responsableAnteriorId = dependencia.responsable_id;
    if (responsableAnteriorId && String(responsableAnteriorId) !== String(responsable._id)) {
        await Usuario.updateOne(
            { _id: responsableAnteriorId, dependencia_id: dependencia._id },
            { $set: { dependencia_id: null } }
        );
    }
    // Si el nuevo responsable venía de otra dependencia, esa dependencia queda sin responsable
    if (responsable.dependencia_id && String(responsable.dependencia_id) !== String(dependencia._id)) {
        await DependenciaArea.updateOne(
            { _id: responsable.dependencia_id, responsable_id: responsable._id },
            { $set: { responsable_id: null } }
        );
    }

    dependencia.responsable_id = responsable._id;
    responsable.dependencia_id = dependencia._id;
    await dependencia.save();
    await responsable.save();

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: 'ASIGNAR_RESPONSABLE',
        entidad_afectada: 'dependencias_areas',
        detalles: { dependencia_id: dependencia._id, responsable_id: responsable._id }
    });

    res.status(200).json({
        mensaje: 'Responsable asignado a la dependencia exitosamente.',
        dependencia
    });
});
