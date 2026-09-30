const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/env');

// Hash bcrypt de una clave inexistente: se compara cuando el correo no existe para que
// la respuesta tarde lo mismo que con un usuario real (evita enumerar cuentas por tiempo).
const HASH_FALSO = '$2b$12$1rAKXUvIxh87AMP2uGao0O9QEJbEo4NUNHt7ijvV2gjU8H6FdUDsi';

// Los tokens de recuperación solo se guardan hasheados (si se filtra la BD no sirven).
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const generarJwt = (usuario) => jwt.sign(
    {
        id: usuario._id,
        nombre: usuario.nombre_completo,
        correo: usuario.correo_institucional,
        rol: usuario.rol,
        dependencia_id: usuario.dependencia_id || null,
        supervisor_id: usuario.supervisor_id || null
    },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '8h' }
);

module.exports = { HASH_FALSO, hashToken, generarJwt };
