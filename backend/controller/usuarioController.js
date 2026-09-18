const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const { registrar } = require('../services/auditoriaService');
const { ROLES_CREABLES_POR_ROL } = require('../middlewares/authMiddleware');
const validarPassword = require('../utils/validarPassword');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const usuarioIdActual = (req) => req.usuario?.id || req.usuario?._id || req.usuario?.uid;

// Crear un usuario respetando la cadena jerárquica (RF-009, RF-011, RF-012)
exports.crearUsuario = asyncHandler(async (req, res) => {
    const { nombre_completo, correo_institucional, password, rol, dependencia_id, telefono, cargo } = req.body;

    if (!nombre_completo || !correo_institucional || !password || !rol) {
        throw new AppError('Faltan campos obligatorios: nombre_completo, correo_institucional, password, rol.', 400);
    }

    const politica = validarPassword(password);
    if (!politica.valida) {
        throw new AppError(politica.mensaje, 400);
    }

    const usuarioExistente = await Usuario.findOne({ correo_institucional });
    if (usuarioExistente) {
        throw new AppError('El correo institucional ya está registrado.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const creadorId = usuarioIdActual(req);
    const supervisor_id = req.usuario.rol === 'Supervisor' ? creadorId : null;

    const nuevoUsuario = new Usuario({
        nombre_completo,
        correo_institucional,
        password_hash,
        rol,
        dependencia_id: dependencia_id || null,
        supervisor_id,
        telefono,
        cargo
    });

    await nuevoUsuario.save();

    await registrar({
        usuario_id: creadorId,
        accion: 'CREAR_USUARIO',
        entidad_afectada: 'usuarios',
        detalles: { usuario_creado: nuevoUsuario._id, rol, correo_institucional }
    });

    res.status(201).json({
        mensaje: 'Usuario creado exitosamente.',
        usuario: {
            id: nuevoUsuario._id,
            nombre_completo: nuevoUsuario.nombre_completo,
            correo_institucional: nuevoUsuario.correo_institucional,
            rol: nuevoUsuario.rol
        }
    });
});

// Consultar usuarios (Admin: todos; Supervisor: solo los que creó)
exports.obtenerUsuarios = asyncHandler(async (req, res) => {
    const filtro = {};

    if (req.usuario.rol === 'Supervisor') {
        filtro.supervisor_id = usuarioIdActual(req);
    }

    const usuarios = await Usuario.find(filtro, '-password_hash -token_recuperacion -token_expiracion');
    res.status(200).json(usuarios);
});

// Consultar un usuario específico
exports.obtenerUsuario = asyncHandler(async (req, res) => {
    const usuario = await Usuario.findById(req.params.id, '-password_hash -token_recuperacion -token_expiracion');
    if (!usuario) {
        throw new AppError('Usuario no encontrado.', 404);
    }

    if (req.usuario.rol === 'Supervisor' && String(usuario.supervisor_id) !== String(usuarioIdActual(req))) {
        throw new AppError('Acceso denegado. Este usuario no te pertenece.', 403);
    }

    res.status(200).json(usuario);
});

// Actualizar datos de un usuario (RF-009)
exports.actualizarUsuario = asyncHandler(async (req, res) => {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
        throw new AppError('Usuario no encontrado.', 404);
    }

    if (req.usuario.rol === 'Supervisor' && String(usuario.supervisor_id) !== String(usuarioIdActual(req))) {
        throw new AppError('Acceso denegado. Este usuario no te pertenece.', 403);
    }

    const { nombre_completo, telefono, cargo, dependencia_id, rol } = req.body;

    // Cambio de rol (RF-009 esc.2): re-validar con la jerarquía
    if (rol !== undefined && rol !== usuario.rol) {
        if (String(usuario._id) === String(usuarioIdActual(req))) {
            throw new AppError('No puedes cambiar tu propio rol.', 400);
        }
        const permitidos = ROLES_CREABLES_POR_ROL[req.usuario.rol] || [];
        if (!permitidos.includes(rol)) {
            throw new AppError(`Tu rol (${req.usuario.rol}) no puede asignar el rol ${rol}.`, 403);
        }
        usuario.rol = rol;
    }

    if (nombre_completo !== undefined) usuario.nombre_completo = nombre_completo;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (cargo !== undefined) usuario.cargo = cargo;
    if (dependencia_id !== undefined) usuario.dependencia_id = dependencia_id;

    await usuario.save();

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: 'ACTUALIZAR_USUARIO',
        entidad_afectada: 'usuarios',
        detalles: { usuario_modificado: usuario._id }
    });

    res.status(200).json({ mensaje: 'Usuario actualizado exitosamente.', usuario });
});

// Flujo 7: Habilitar/deshabilitar cuenta en tiempo real (Admin)
exports.cambiarEstadoUsuario = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
        throw new AppError('Debe indicar el campo "activo" (true/false).', 400);
    }

    const usuario = await Usuario.findById(id);
    if (!usuario) {
        throw new AppError('Usuario no encontrado.', 404);
    }

    if (String(usuario._id) === String(usuarioIdActual(req))) {
        throw new AppError('No puedes deshabilitar tu propia cuenta.', 400);
    }

    usuario.activo = !!activo;
    await usuario.save();

    await registrar({
        usuario_id: usuarioIdActual(req),
        accion: activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
        entidad_afectada: 'usuarios',
        detalles: { usuario_afectado: usuario._id }
    });

    res.status(200).json({
        mensaje: `Usuario ${activo ? 'habilitado' : 'deshabilitado'} exitosamente.`,
        usuario: { id: usuario._id, correo_institucional: usuario.correo_institucional, activo: usuario.activo }
    });
});
