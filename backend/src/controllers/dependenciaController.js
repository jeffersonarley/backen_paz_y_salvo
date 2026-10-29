const mongoose = require('mongoose');
const DependenciaArea = require('../models/DependenciaArea');
const Usuario = require('../models/Usuario');
const { registrar } = require('../services/auditoriaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const usuarioIdActual = (req) => req.usuario?.id;

// Roles que pueden quedar a cargo de una dependencia y firmar en su casillero.
// El Supervisor (Coordinador) también puede coordinar/firmar la dependencia que lidera.
const ROLES_RESPONSABLE = ['ResponsableArea', 'Supervisor'];

const normalizarListaIds = (valor) => {
    if (valor === undefined || valor === null) return null;
    const lista = Array.isArray(valor) ? valor : [valor];
    const ids = lista
        .filter((id) => typeof id === 'string' && mongoose.isValidObjectId(id))
        .map((id) => String(id));
    return [...new Set(ids)];
};

// Valida que los usuarios existan y puedan ser responsables de una dependencia
async function validarResponsables(ids) {
    if (!ids.length) return [];
    const usuarios = await Usuario.find({ _id: { $in: ids } });
    if (usuarios.length !== ids.length) {
        throw new AppError('Uno o varios responsables no existen.', 404);
    }
    const invalido = usuarios.find((u) => !ROLES_RESPONSABLE.includes(u.rol));
    if (invalido) {
        throw new AppError(
            `El usuario ${invalido.nombre_completo} no puede ser responsable de una dependencia (rol ${invalido.rol}).`,
            400
        );
    }
    return usuarios;
}

// Sincroniza el vínculo "usuario -> dependencia principal" con la lista de responsables
async function sincronizarVinculos(dependencia, ids, responsablePrincipalAnterior, responsablesPrevios = null) {
    const previos = (responsablesPrevios || dependencia.responsables_ids || []).map((id) => String(id));

    // El responsable principal siempre es el primero de la lista
    if (responsablePrincipalAnterior && !ids.includes(String(responsablePrincipalAnterior))) {
        await Usuario.updateOne(
            { _id: responsablePrincipalAnterior, dependencia_id: dependencia._id },
            { $set: { dependencia_id: null } }
        );
    }

    if (ids.length > 0) {
        await Usuario.updateOne({ _id: ids[0] }, { $set: { dependencia_id: dependencia._id } });
    }

    // Usuarios que quedaron fuera y solo tenían esta dependencia como principal
    const removidos = previos.filter((id) => !ids.includes(id));
    if (removidos.length > 0) {
        await Usuario.updateMany(
            { _id: { $in: removidos }, dependencia_id: dependencia._id },
            { $set: { dependencia_id: null } }
        );
    }
}

// RF-012: Crear dependencia (Supervisor / Coordinador)
exports.crearDependencia = asyncHandler(async (req, res) => {
    const { nombre_dependencia, responsable_id, responsable_ids } = req.body;

    if (typeof nombre_dependencia !== 'string' || !nombre_dependencia.trim()) {
        throw new AppError('El nombre de la dependencia es obligatorio.', 400);
    }

    const existente = await DependenciaArea.findOne({ nombre_dependencia: nombre_dependencia.trim() });
    if (existente) {
        throw new AppError('La dependencia ya se encuentra creada.', 400);
    }

    const ids = normalizarListaIds(responsable_ids) || normalizarListaIds(responsable_id) || [];
    const responsables = await validarResponsables(ids);

    const nueva = await DependenciaArea.create({
        nombre_dependencia: nombre_dependencia.trim(),
        activo: true,
        responsable_id: responsables.length ? responsables[0]._id : null,
        responsables_ids: responsables.map((r) => r._id)
    });

    if (responsables.length) {
        await Usuario.updateOne(
            { _id: responsables[0]._id },
            { $set: { dependencia_id: nueva._id } }
        );
    }

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: 'CREAR_DEPENDENCIA',
        entidad_afectada: 'dependencias_areas',
        detalles: {
            dependencia_id: nueva._id,
            nombre_dependencia: nueva.nombre_dependencia,
            responsables: responsables.map((r) => r._id)
        }
    });

    const dependencia = await DependenciaArea.findById(nueva._id)
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol');

    res.status(201).json({ mensaje: 'Dependencia creada exitosamente.', dependencia });
});

// RF-012: Listar dependencias
exports.obtenerDependencias = asyncHandler(async (req, res) => {
    const dependencias = await DependenciaArea.find()
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol')
        .sort({ nombre_dependencia: 1 });
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
        detalles: { dependencia_id: dependencia._id, activo: dependencia.activo }
    });

    const actualizada = await DependenciaArea.findById(dependencia._id)
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol');

    res.status(200).json({ mensaje: 'Dependencia actualizada exitosamente.', dependencia: actualizada });
});

// RF-012: Asignar (o agregar) responsable de área a una dependencia
exports.asignarResponsable = asyncHandler(async (req, res) => {
    const dependencia = await DependenciaArea.findById(req.params.id);
    if (!dependencia) {
        throw new AppError('Dependencia no encontrada.', 404);
    }

    const { responsable_id } = req.body;
    if (typeof responsable_id !== 'string' || !mongoose.isValidObjectId(responsable_id)) {
        throw new AppError('Debe indicar un responsable_id válido.', 400);
    }

    const [responsable] = await validarResponsables([responsable_id]);

    const actuales = (dependencia.responsables_ids || []).map((id) => String(id));
    const ids = actuales.includes(String(responsable._id))
        ? actuales
        : [...actuales, String(responsable._id)];

    dependencia.responsable_id = dependencia.responsable_id || responsable._id;
    dependencia.responsables_ids = ids;
    await dependencia.save();
    await sincronizarVinculos(dependencia, ids, null);

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: 'ASIGNAR_RESPONSABLE',
        entidad_afectada: 'dependencias_areas',
        detalles: { dependencia_id: dependencia._id, responsable_id: responsable._id }
    });

    const actualizada = await DependenciaArea.findById(dependencia._id)
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol');

    res.status(200).json({
        mensaje: 'Responsable asignado a la dependencia exitosamente.',
        dependencia: actualizada
    });
});

// RF-012: Reemplazar la lista de responsables de una dependencia (varios por dependencia)
exports.actualizarResponsables = asyncHandler(async (req, res) => {
    const dependencia = await DependenciaArea.findById(req.params.id);
    if (!dependencia) {
        throw new AppError('Dependencia no encontrada.', 404);
    }

    const ids = normalizarListaIds(req.body.responsable_ids);
    if (ids === null) {
        throw new AppError('Debe indicar la lista de responsables (responsable_ids).', 400);
    }

    const responsables = await validarResponsables(ids);
    const responsablePrincipalAnterior = dependencia.responsable_id
        ? String(dependencia.responsable_id)
        : null;
    // Se guarda la lista previa antes de sobrescribir para poder quitar el vínculo
    // "dependencia principal" de quienes quedan fuera de la nueva lista.
    const responsablesPrevios = (dependencia.responsables_ids || []).map((id) => String(id));

    dependencia.responsables_ids = responsables.map((r) => r._id);
    dependencia.responsable_id = responsables.length ? responsables[0]._id : null;
    await dependencia.save();
    await sincronizarVinculos(dependencia, ids, responsablePrincipalAnterior, responsablesPrevios);

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: 'ACTUALIZAR_RESPONSABLES_DEPENDENCIA',
        entidad_afectada: 'dependencias_areas',
        detalles: { dependencia_id: dependencia._id, responsables: ids }
    });

    const actualizada = await DependenciaArea.findById(dependencia._id)
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol');

    res.status(200).json({
        mensaje: 'Responsables actualizados exitosamente.',
        dependencia: actualizada
    });
});

// Toggle estado (activar/desactivar)
exports.toggleEstado = asyncHandler(async (req, res) => {
    const dependencia = await DependenciaArea.findById(req.params.id);
    if (!dependencia) {
        throw new AppError('Dependencia no encontrada.', 404);
    }

    dependencia.activo = !dependencia.activo;
    await dependencia.save();

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: dependencia.activo ? 'ACTIVAR_DEPENDENCIA' : 'DESACTIVAR_DEPENDENCIA',
        entidad_afectada: 'dependencias_areas',
        detalles: { dependencia_id: dependencia._id, nuevo_estado: dependencia.activo }
    });

    const actualizada = await DependenciaArea.findById(dependencia._id)
        .populate('responsable_id', 'nombre_completo correo_institucional rol')
        .populate('responsables_ids', 'nombre_completo correo_institucional rol');

    res.status(200).json({
        mensaje: `Dependencia ${actualizada.activo ? 'activada' : 'desactivada'} correctamente.`,
        dependencia: actualizada
    });
});
