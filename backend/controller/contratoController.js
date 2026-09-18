const mongoose = require('mongoose');
const Contrato = require('../models/Contrato');
const BienEntregado = require('../models/BienEntregado');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const { getFormatoVigente } = require('../services/formatoCache');
const { registrar } = require('../services/auditoriaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Diagrama 2: Registro contractual e inventario (transacción atómica + fallback)
exports.crearContrato = asyncHandler(async (req, res) => {
    const { numero, telefono, dependencia, bienes } = req.body;

    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;
    if (!usuarioId) {
        throw new AppError('No se pudo identificar al usuario autenticado.', 401);
    }

    if (!numero || !telefono || !dependencia) {
        throw new AppError('Todos los campos obligatorios del contrato (numero, telefono, dependencia) deben estar diligenciados.', 400);
    }

    if (!mongoose.isValidObjectId(dependencia)) {
        throw new AppError('La dependencia debe ser un identificador (ObjectId) válido de DependenciaArea.', 400);
    }

    if (!bienes || !Array.isArray(bienes) || bienes.length === 0) {
        throw new AppError('Debe incluir al menos un bien en el inventario.', 400);
    }

    for (const [index, bien] of bienes.entries()) {
        const descripcion = bien.descripcion || bien.nombre;
        const codigo = bien.codigo_inventario || bien.codigo || bien.placa;
        if (!descripcion || !String(descripcion).trim()) {
            throw new AppError(`El bien #${index + 1} no tiene descripción.`, 400);
        }
        if (!codigo || !String(codigo).trim()) {
            throw new AppError(`El bien #${index + 1} no tiene código de inventario.`, 400);
        }
    }

    let versionFormato = 1;
    try {
        const formato = await getFormatoVigente();
        if (formato && formato.numero_version) versionFormato = formato.numero_version;
    } catch (e) {
        console.warn('No se pudo obtener la versión del formato, usando 1:', e.message);
    }

    const nuevoContrato = new Contrato({
        numero_contrato: numero,
        nombre_contratista: req.usuario.nombre || req.usuario.nombre_completo || 'Contratista',
        correo_contratista: req.usuario.correo || req.usuario.correo_institucional || req.usuario.email,
        telefono,
        dependencia,
        usuario: usuarioId,
        supervisor: req.usuario.supervisor_id || null,
        estado: 'Borrador',
        version_formato: versionFormato
    });

    const bienesConContrato = bienes.map(bien => ({
        descripcion: bien.descripcion || bien.nombre,
        codigo_inventario: bien.codigo_inventario || bien.codigo || bien.placa,
        cantidad: bien.cantidad || 1,
        estado_bien: bien.estado_bien || 'Bueno',
        contrato_id: nuevoContrato._id
    }));

    // Intentar transacción atómica (requiere replica set en MongoDB)
    const session = await mongoose.startSession();
    let creado = false;

    try {
        await session.withTransaction(async () => {
            await nuevoContrato.save({ session });
            await BienEntregado.insertMany(bienesConContrato, { session });
        });
        creado = true;
    } catch (txError) {
        console.warn('Transacción fallida o no soportada, intentando fallback:', txError.message);
    } finally {
        try { session.endSession(); } catch (e) { /* noop */ }
    }

    // Fallback secuencial con compensación manual (standalone)
    if (!creado) {
        try {
            await nuevoContrato.save();
            await BienEntregado.insertMany(bienesConContrato);
        } catch (fallbackErr) {
            await Contrato.findByIdAndDelete(nuevoContrato._id).catch(() => {});
            throw new AppError('Error interno del servidor al procesar el contrato (fallback).', 500);
        }
    }

    await registrar({
        usuario_id: usuarioId,
        accion: 'CREAR_CONTRATO',
        entidad_afectada: 'contratos_gccon_f088',
        detalles: { contrato_id: nuevoContrato._id, numero_contrato: numero, modo: creado ? 'transaccion' : 'fallback' }
    });

    res.status(201).json({
        mensaje: 'Registro contractual e inventario creado exitosamente en estado Borrador.',
        contrato: nuevoContrato
    });
});

// RF-005: Contratista consulta el estado de sus propias solicitudes
exports.misSolicitudes = asyncHandler(async (req, res) => {
    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;
    const contratos = await Contrato.find({ usuario: usuarioId })
        .populate('dependencia', 'nombre_dependencia')
        .populate('supervisor', 'nombre_completo correo_institucional')
        .sort({ createdAt: -1 });
    res.status(200).json(contratos);
});

// Listar contratos según el rol (Supervisor: asignados; ResponsableArea: con firma en su área; Admin: todos)
exports.listarContratos = asyncHandler(async (req, res) => {
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;
    let filtro = {};

    if (rol === 'Supervisor') {
        filtro = { supervisor: usuarioId };
    } else if (rol === 'ResponsableArea') {
        const dependencia_id = req.usuario?.dependencia_id;
        if (!dependencia_id) {
            throw new AppError('No se pudo identificar el área del usuario.', 403);
        }
        const firmasPendientes = await TrazabilidadFirma.find({ area_id: dependencia_id }).distinct('contrato_id');
        filtro = { _id: { $in: firmasPendientes } };
    } else if (rol !== 'Administrador') {
        throw new AppError('Acceso denegado.', 403);
    }

    const contratos = await Contrato.find(filtro)
        .populate('dependencia', 'nombre_dependencia')
        .populate('supervisor', 'nombre_completo correo_institucional')
        .sort({ createdAt: -1 });

    res.status(200).json(contratos);
});

// Obtener detalle de un contrato (según permisos por rol)
exports.obtenerContrato = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id)
        .populate('dependencia', 'nombre_dependencia')
        .populate('supervisor', 'nombre_completo correo_institucional')
        .populate('usuario', 'nombre_completo correo_institucional');

    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const rol = req.usuario?.rol;
    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;

    if (rol === 'Contratista' && String(contrato.usuario?._id || contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (rol === 'Supervisor' && String(contrato.supervisor?._id || contrato.supervisor) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. No estás asignado a este contrato.', 403);
    }

    const bienes = await BienEntregado.find({ contrato_id: contrato._id });
    res.status(200).json({ contrato, bienes });
});

// RF-002: Contratista actualiza su contrato (solo en estado Borrador)
exports.actualizarContrato = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;
    if (String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (contrato.estado !== 'Borrador') {
        throw new AppError('Solo se puede modificar un contrato en estado Borrador.', 400);
    }

    const { numero, telefono, dependencia } = req.body;
    if (numero !== undefined) contrato.numero_contrato = numero;
    if (telefono !== undefined) contrato.telefono = telefono;
    if (dependencia !== undefined) {
        if (!mongoose.isValidObjectId(dependencia)) {
            throw new AppError('La dependencia debe ser un ObjectId válido.', 400);
        }
        contrato.dependencia = dependencia;
    }

    await contrato.save();
    res.status(200).json({ mensaje: 'Contrato actualizado exitosamente.', contrato });
});

// RF-002 esc.4: Cancelar (eliminar) un contrato en estado Borrador
exports.cancelarContrato = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;
    if (String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (contrato.estado !== 'Borrador') {
        throw new AppError('Solo se puede cancelar un contrato en estado Borrador.', 400);
    }

    await BienEntregado.deleteMany({ contrato_id: contrato._id });
    await Contrato.findByIdAndDelete(contrato._id);

    await registrar({
        usuario_id: usuarioId,
        accion: 'CANCELAR_CONTRATO',
        entidad_afectada: 'contratos_gccon_f088',
        detalles: { contrato_id: contrato._id }
    });

    res.status(200).json({ mensaje: 'Contrato cancelado exitosamente.' });
});

// RF-003 esc.4: Eliminar un bien del inventario (contrato en Borrador)
exports.eliminarBien = asyncHandler(async (req, res) => {
    const { id, bienId } = req.params;

    const contrato = await Contrato.findById(id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;
    if (String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (contrato.estado !== 'Borrador') {
        throw new AppError('Solo se puede modificar el inventario en estado Borrador.', 400);
    }

    const bien = await BienEntregado.findOneAndDelete({ _id: bienId, contrato_id: contrato._id });
    if (!bien) {
        throw new AppError('Bien no encontrado en este contrato.', 404);
    }

    await registrar({
        usuario_id: usuarioId,
        accion: 'ELIMINAR_BIEN',
        entidad_afectada: 'bienes_entregados',
        detalles: { contrato_id: contrato._id, bien_id: bienId }
    });

    res.status(200).json({ mensaje: 'Bien eliminado exitosamente.' });
});

// RF-014 esc.4: Consultar todas las observaciones del trámite (supervisor + áreas)
exports.obtenerObservaciones = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;
    const rol = req.usuario?.rol;
    const esDueno = String(contrato.usuario) === String(usuarioId);
    const esSupervisor = rol === 'Supervisor' && String(contrato.supervisor) === String(usuarioId);

    if (!esDueno && !esSupervisor && rol !== 'Administrador') {
        throw new AppError('Acceso denegado.', 403);
    }

    const firmas = await TrazabilidadFirma.find({
        contrato_id: contrato._id,
        observacion_rechazo: { $ne: null }
    }).populate('area_id', 'nombre_dependencia');

    const observaciones_areas = firmas
        .filter(f => f.observacion_rechazo)
        .map(f => ({
            area: f.area_id?.nombre_dependencia || f.area_id,
            observacion: f.observacion_rechazo,
            estado: f.estado
        }));

    res.status(200).json({
        observaciones_supervisor: contrato.observaciones_supervisor || null,
        observaciones_areas
    });
});
