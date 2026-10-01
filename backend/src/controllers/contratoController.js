const mongoose = require('mongoose');
const Contrato = require('../models/Contrato');
const DependenciaArea = require('../models/DependenciaArea');
const BienEntregado = require('../models/BienEntregado');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const { getFormatoVigente } = require('../services/formatoCache');
const { registrar } = require('../services/auditoriaService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Helper: resolver la dependencia por su ObjectId o por su nombre
async function resolverDependencia(valor) {
    const valorTexto = String(valor || '').trim();
    if (!valorTexto) {
        throw new AppError('La dependencia es obligatoria.', 400);
    }

    if (mongoose.isValidObjectId(valorTexto)) {
        const porId = await DependenciaArea.findById(valorTexto);
        if (!porId) {
            throw new AppError('La dependencia indicada no existe.', 404);
        }
        return porId;
    }

    const porNombre = await DependenciaArea.findOne({ nombre_dependencia: valorTexto });
    if (!porNombre) {
        throw new AppError('La dependencia indicada no existe.', 404);
    }
    return porNombre;
}

// La fecha de fin no puede ser anterior a la de inicio
function validarRangoFechas(inicio, fin) {
    if (inicio && fin && new Date(fin) < new Date(inicio)) {
        throw new AppError('La fecha de fin no puede ser anterior a la fecha de inicio.', 400);
    }
}

// Diagrama 2: Registro contractual e inventario (transacción atómica + fallback)
exports.crearContrato = asyncHandler(async (req, res) => {
    const { numero, telefono, dependencia, bienes, objeto_contractual, fecha_inicio, fecha_fin, adjunto_nombre } = req.body;

    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
        throw new AppError('No se pudo identificar al usuario autenticado.', 401);
    }

    if (!numero || !telefono || !dependencia) {
        throw new AppError('Todos los campos obligatorios del contrato (numero, telefono, dependencia) deben estar diligenciados.', 400);
    }

    validarRangoFechas(fecha_inicio, fecha_fin);

    // Duplicado explícito: da un 400 claro en lugar de un 500 genérico
    if (await Contrato.exists({ numero_contrato: String(numero).trim() })) {
        throw new AppError('Ya existe un contrato con ese número.', 400);
    }

    const dependenciaArea = await resolverDependencia(dependencia);

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
        dependencia: dependenciaArea._id,
        usuario: usuarioId,
        supervisor: req.usuario.supervisor_id || null,
        objeto_contractual: objeto_contractual || null,
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        adjunto_nombre: adjunto_nombre || null,
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
        // Un duplicado o un error de validación NO es un problema de transacciones: se informa tal cual
        if (txError.code === 11000 || txError.name === 'ValidationError') {
            throw txError;
        }
        console.warn('Transacción fallida o no soportada, intentando fallback:', txError.message);
    } finally {
        try { await session.endSession(); } catch (e) { /* noop */ }
    }

    // Fallback secuencial con compensación manual (MongoDB standalone, sin replica set)
    if (!creado) {
        try {
            nuevoContrato.isNew = true;
            await nuevoContrato.save();
            await BienEntregado.insertMany(bienesConContrato);
        } catch (fallbackErr) {
            // Compensación: no se deja un contrato a medias (ni contrato sin bienes ni bienes huérfanos)
            await BienEntregado.deleteMany({ contrato_id: nuevoContrato._id }).catch(() => {});
            await Contrato.findByIdAndDelete(nuevoContrato._id).catch(() => {});
            if (fallbackErr.code === 11000 || fallbackErr.name === 'ValidationError') {
                throw fallbackErr;
            }
            console.error('Error creando contrato (fallback):', fallbackErr);
            throw new AppError('Error interno del servidor al procesar el contrato.', 500);
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
    const usuarioId = req.usuario?.id;
    const contratos = await Contrato.find({ usuario: usuarioId })
        .populate('dependencia', 'nombre_dependencia')
        .populate('supervisor', 'nombre_completo correo_institucional')
        .sort({ createdAt: -1 });
    res.status(200).json(contratos);
});

// Listar contratos según el rol (Supervisor: asignados; ResponsableArea: con firma en su área; Admin: todos)
exports.listarContratos = asyncHandler(async (req, res) => {
    const rol = req.usuario?.rol;
    const usuarioId = req.usuario?.id;
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

    const trazas = await TrazabilidadFirma.find({
        contrato_id: { $in: contratos.map(contrato => contrato._id) }
    })
        .populate('area_id', 'nombre_dependencia')
        .populate('usuario_id', 'nombre_completo')
        .sort({ createdAt: 1, _id: 1 })
        .lean();
    const trazasPorContrato = new Map();
    for (const traza of trazas) {
        const contratoId = String(traza.contrato_id);
        const cadena = trazasPorContrato.get(contratoId) || [];
        cadena.push(traza);
        trazasPorContrato.set(contratoId, cadena);
    }

    res.status(200).json(contratos.map(contrato => ({
        ...contrato.toObject(),
        firmas: trazasPorContrato.get(String(contrato._id)) || []
    })));
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
    const usuarioId = req.usuario?.id;

    if (rol === 'Contratista' && String(contrato.usuario?._id || contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (rol === 'Supervisor' && String(contrato.supervisor?._id || contrato.supervisor) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. No estás asignado a este contrato.', 403);
    }

    // ResponsableArea: solo los contratos donde su dependencia tiene un casillero de firma
    if (rol === 'ResponsableArea') {
        const dependenciaId = req.usuario?.dependencia_id;
        const tieneCasillero = dependenciaId
            && await TrazabilidadFirma.exists({ contrato_id: contrato._id, area_id: dependenciaId });
        if (!tieneCasillero) {
            throw new AppError('Acceso denegado. Este contrato no está asignado a su área.', 403);
        }
    }

    // Cualquier otro rol no contemplado no tiene acceso
    if (!['Contratista', 'Supervisor', 'ResponsableArea', 'Administrador'].includes(rol)) {
        throw new AppError('Acceso denegado.', 403);
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

    const usuarioId = req.usuario?.id;
    if (String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (contrato.estado !== 'Borrador') {
        throw new AppError('Solo se puede modificar un contrato en estado Borrador.', 400);
    }

    const { numero, telefono, dependencia, objeto_contractual, fecha_inicio, fecha_fin } = req.body;
    if (numero !== undefined) contrato.numero_contrato = numero;
    if (telefono !== undefined) contrato.telefono = telefono;
    if (dependencia !== undefined) {
        const dependenciaArea = await resolverDependencia(dependencia);
        contrato.dependencia = dependenciaArea._id;
    }
    if (objeto_contractual !== undefined) contrato.objeto_contractual = objeto_contractual;
    if (fecha_inicio !== undefined) contrato.fecha_inicio = fecha_inicio || null;
    if (fecha_fin !== undefined) contrato.fecha_fin = fecha_fin || null;

    validarRangoFechas(contrato.fecha_inicio, contrato.fecha_fin);

    await contrato.save();
    res.status(200).json({ mensaje: 'Contrato actualizado exitosamente.', contrato });
});

// RF-002 esc.4: Cancelar (eliminar) un contrato en estado Borrador
exports.cancelarContrato = asyncHandler(async (req, res) => {
    const contrato = await Contrato.findById(req.params.id);
    if (!contrato) {
        throw new AppError('Contrato no encontrado.', 404);
    }

    const usuarioId = req.usuario?.id;
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

    const usuarioId = req.usuario?.id;
    if (String(contrato.usuario) !== String(usuarioId)) {
        throw new AppError('Acceso denegado. Este contrato no te pertenece.', 403);
    }

    if (contrato.estado !== 'Borrador') {
        throw new AppError('Solo se puede modificar el inventario en estado Borrador.', 400);
    }

    const totalBienes = await BienEntregado.countDocuments({ contrato_id: contrato._id });
    if (totalBienes <= 1) {
        throw new AppError('El contrato debe conservar al menos un bien en el inventario.', 400);
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

    const usuarioId = req.usuario?.id;
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
