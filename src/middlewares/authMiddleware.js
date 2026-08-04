const jwt = require('jsonwebtoken');

// 1. Validar que la petición tenga un Token JWT válido
const verificarToken = (req, res, next) => {
    // Obtener el token del encabezado de la petición (compatible con minúsculas y mayúsculas)
    const authHeader = req.headers.authorization || req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ 
            mensaje: 'Acceso denegado. No se proporcionó un token de autenticación.' 
        });
    }

    try {
        // Formato esperado: "Bearer TOKEN_AQUÍ" (limpia espacios innecesarios)
        const token = authHeader.toLowerCase().startsWith('bearer ') 
            ? authHeader.slice(7).trim() 
            : authHeader.trim();

        // Verificar el token con la clave secreta del .env
        const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto_sena_pazysalvo');

        // Guardar la información del usuario en req.usuario
        req.usuario = decodificado;

        next(); // Continuar al controlador o siguiente middleware
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

module.exports = {
    verificarToken,
    verificarRol
};