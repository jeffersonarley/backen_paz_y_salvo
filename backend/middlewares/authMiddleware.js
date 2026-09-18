const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Jerarquía de creación de usuarios (Flujo de negocio):
// - Administrador crea Supervisores.
// - Supervisor crea Contratistas y Responsables de Área.
const ROLES_CREABLES_POR_ROL = {
    Administrador: ['Supervisor'],
    Supervisor: ['Contratista', 'ResponsableArea']
};

// 1. Validar que la petición tenga un Token JWT válido y que el usuario siga activo
const verificarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({
            mensaje: 'Acceso denegado. No se proporcionó un token de autenticación.'
        });
    }

    try {
        const token = authHeader.toLowerCase().startsWith('bearer ')
            ? authHeader.slice(7).trim()
            : authHeader.trim();

        const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_sena_pazysalvo');

        req.usuario = decodificado;

        // Flujo 7: consulta rápida en BD para expulsar en tiempo real a usuarios deshabilitados
        const usuarioBD = await Usuario.findById(decodificado.id);
        if (!usuarioBD || usuarioBD.activo === false) {
            return res.status(401).json({ mensaje: 'Usuario deshabilitado.' });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: 'Token no válido o expirado. Por favor, inicie sesión de nuevo.'
        });
    }
};

// 2. Validar si el usuario tiene el Rol necesario para realizar la acción
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado.' });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: `Acceso denegado. Tu rol (${req.usuario.rol}) no tiene permisos para esta acción.`
            });
        }

        next();
    };
};

// 3. Validar la cadena jerárquica de creación de usuarios
const verificarJerarquia = (req, res, next) => {
    const rolCreador = req.usuario?.rol;
    const rolDestino = req.body?.rol;

    if (!rolDestino) {
        return res.status(400).json({ mensaje: 'Debe indicar el rol del usuario a crear.' });
    }

    const permitidos = ROLES_CREABLES_POR_ROL[rolCreador] || [];
    if (!permitidos.includes(rolDestino)) {
        return res.status(403).json({
            mensaje: `Tu rol (${rolCreador}) no puede crear usuarios con rol ${rolDestino}.`
        });
    }

    next();
};

module.exports = {
    verificarToken,
    verificarRol,
    verificarJerarquia,
    ROLES_CREABLES_POR_ROL
};
