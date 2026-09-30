const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { getJwtSecret } = require('../config/env');

// Jerarquía de creación de usuarios (Flujo de negocio):
// - Administrador crea Supervisores.
// - Supervisor crea Contratistas y Responsables de Área.
const ROLES_CREABLES_POR_ROL = {
    Administrador: ['Supervisor'],
    Supervisor: ['Contratista', 'ResponsableArea']
};

const idComoTexto = (valor) => (valor ? String(valor) : null);

// 1. Validar el Token JWT y cargar el usuario ACTUAL desde la BD.
//    req.usuario se arma con los datos de la BD (no con los del token), de modo que un
//    cambio de rol, de dependencia o de estado tiene efecto inmediato sin esperar a que
//    caduque el token.
const verificarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization || req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({
            mensaje: 'Acceso denegado. No se proporcionó un token de autenticación.'
        });
    }

    // Si falta JWT_SECRET esto lanza un error de configuración (500), no un 401 engañoso
    const secreto = getJwtSecret();

    let decodificado;
    try {
        const token = authHeader.toLowerCase().startsWith('bearer ')
            ? authHeader.slice(7).trim()
            : authHeader.trim();

        // Se fija el algoritmo para descartar tokens con "alg" manipulado
        decodificado = jwt.verify(token, secreto, { algorithms: ['HS256'] });
    } catch (error) {
        return res.status(401).json({
            mensaje: 'Token no válido o expirado. Por favor, inicie sesión de nuevo.'
        });
    }

    try {
        // Flujo 7: consulta en BD para expulsar en tiempo real a usuarios deshabilitados
        const usuarioBD = await Usuario.findById(decodificado.id);
        if (!usuarioBD || usuarioBD.activo === false) {
            return res.status(401).json({ mensaje: 'Usuario deshabilitado.' });
        }

        // Tokens emitidos antes del último cambio de contraseña quedan invalidados
        if (usuarioBD.password_changed_at) {
            const cambioEnSegundos = Math.floor(usuarioBD.password_changed_at.getTime() / 1000);
            if (!decodificado.iat || decodificado.iat < cambioEnSegundos) {
                return res.status(401).json({
                    mensaje: 'La contraseña fue modificada. Por favor, inicie sesión de nuevo.'
                });
            }
        }

        req.usuario = {
            id: String(usuarioBD._id),
            nombre: usuarioBD.nombre_completo,
            nombre_completo: usuarioBD.nombre_completo,
            correo: usuarioBD.correo_institucional,
            correo_institucional: usuarioBD.correo_institucional,
            rol: usuarioBD.rol,
            dependencia_id: idComoTexto(usuarioBD.dependencia_id),
            supervisor_id: idComoTexto(usuarioBD.supervisor_id)
        };

        return next();
    } catch (error) {
        return next(error);
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
