const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { enviarCorreo } = require('../services/emailService');
const validarPassword = require('../utils/validarPassword');
const { hashPassword } = require('../utils/password');
const { HASH_FALSO, hashToken, generarJwt } = require('../utils/tokens');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const MAX_INTENTOS = 3;
const MINUTOS_BLOQUEO = 15;
const LONGITUD_MAX_PASSWORD = 128;

// Defensa contra inyección NoSQL: los campos deben ser texto, nunca objetos ({ "$ne": null })
const esTexto = (valor) => typeof valor === 'string';

// Flujo 1: Login con bloqueo por intentos fallidos
exports.login = asyncHandler(async (req, res) => {
    const { correo_institucional, password } = req.body;

    if (!esTexto(correo_institucional) || !esTexto(password) || !correo_institucional.trim() || !password) {
        throw new AppError('Por favor, ingrese correo institucional y contraseña.', 400);
    }
    if (password.length > LONGITUD_MAX_PASSWORD) {
        throw new AppError('Credenciales inválidas.', 401);
    }

    const usuario = await Usuario.findOne({ correo_institucional: correo_institucional.trim().toLowerCase() });
    if (!usuario) {
        // Se gasta el mismo tiempo que con un usuario real (evita enumerar cuentas por latencia)
        await bcrypt.compare(password, HASH_FALSO);
        throw new AppError('Credenciales inválidas.', 401);
    }

    const ahora = new Date();

    if (usuario.bloqueado_hasta && ahora < usuario.bloqueado_hasta) {
        const minutosRestantes = Math.ceil((usuario.bloqueado_hasta - ahora) / (1000 * 60));
        throw new AppError(`Cuenta bloqueada por intentos fallidos. Intente de nuevo en ${minutosRestantes} minuto(s).`, 403);
    }

    const esCorrecta = await bcrypt.compare(password, usuario.password_hash);

    if (!esCorrecta) {
        // Incremento atómico: dos intentos simultáneos no se pisan el contador
        const actualizado = await Usuario.findOneAndUpdate(
            { _id: usuario._id },
            { $inc: { intentos_fallidos: 1 } },
            { returnDocument: 'after' }
        );

        if (actualizado && actualizado.intentos_fallidos >= MAX_INTENTOS) {
            await Usuario.updateOne(
                { _id: usuario._id },
                { $set: { intentos_fallidos: 0, bloqueado_hasta: new Date(ahora.getTime() + MINUTOS_BLOQUEO * 60 * 1000) } }
            );
            throw new AppError(`Ha superado los ${MAX_INTENTOS} intentos fallidos. Cuenta bloqueada por ${MINUTOS_BLOQUEO} minutos.`, 403);
        }

        // Mensaje genérico: no revela si el correo existe ni cuántos intentos quedan
        throw new AppError('Credenciales inválidas.', 401);
    }

    // El estado de la cuenta solo se revela a quien conoce la contraseña
    if (usuario.activo === false) {
        throw new AppError('Usuario deshabilitado. Contacte al administrador.', 401);
    }

    await Usuario.updateOne({ _id: usuario._id }, { $set: { intentos_fallidos: 0, bloqueado_hasta: null } });

    res.status(200).json({
        mensaje: 'Inicio de sesión exitoso.',
        token: generarJwt(usuario),
        usuario: {
            id: usuario._id,
            nombre: usuario.nombre_completo,
            correo: usuario.correo_institucional,
            rol: usuario.rol
        }
    });
});

// Flujo 5: Solicitar recuperación de contraseña (genera token efímero)
exports.recuperar = asyncHandler(async (req, res) => {
    const { correo_institucional } = req.body;
    const respuestaGenerica = { mensaje: 'Si el correo existe, se ha enviado un enlace de recuperación.' };

    if (!esTexto(correo_institucional) || !correo_institucional.trim()) {
        throw new AppError('Por favor, ingrese su correo institucional.', 400);
    }

    const usuario = await Usuario.findOne({ correo_institucional: correo_institucional.trim().toLowerCase() });

    // Anti-enumeración: siempre responde 200 con mensaje genérico
    if (!usuario || usuario.activo === false) {
        return res.status(200).json(respuestaGenerica);
    }

    // El token en claro solo viaja por correo; en la BD se guarda su hash SHA-256
    const token = crypto.randomBytes(32).toString('hex');
    usuario.token_recuperacion = hashToken(token);
    usuario.token_expiracion = new Date(Date.now() + 15 * 60 * 1000);
    await usuario.save();

    const enlace = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/restablecer?token=${token}`;
    await enviarCorreo({
        to: usuario.correo_institucional,
        subject: 'Recuperación de contraseña - Paz y Salvo SENA',
        text: `Hola ${usuario.nombre_completo},\n\nPara restablecer su contraseña ingrese al siguiente enlace (válido por 15 minutos):\n${enlace}\n\nSi no solicitó este cambio, ignore este mensaje.`
    });

    return res.status(200).json(respuestaGenerica);
});

// Flujo 5: Restablecer contraseña con token efímero (body { token, nueva_password })
exports.restablecer = asyncHandler(async (req, res) => {
    const { token, nueva_password } = req.body;

    if (!esTexto(token) || !esTexto(nueva_password) || !token || !nueva_password) {
        throw new AppError('Faltan campos: token y nueva_password.', 400);
    }

    const usuario = await Usuario.findOne({
        token_recuperacion: hashToken(token),
        token_expiracion: { $gt: new Date() }
    });

    if (!usuario) {
        throw new AppError('El enlace es inválido o ha expirado.', 400);
    }

    const politica = validarPassword(nueva_password);
    if (!politica.valida) {
        throw new AppError(politica.mensaje, 400);
    }

    usuario.password_hash = await hashPassword(nueva_password);
    usuario.password_changed_at = new Date();
    usuario.token_recuperacion = null;
    usuario.token_expiracion = null;
    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta = null;
    await usuario.save();

    return res.status(200).json({ mensaje: 'Contraseña restablecida exitosamente.' });
});

// RF-015: Cambiar contraseña (autenticado)
exports.cambiarPassword = asyncHandler(async (req, res) => {
    const { password_actual, nueva_password } = req.body;

    if (!esTexto(password_actual) || !esTexto(nueva_password) || !password_actual || !nueva_password) {
        throw new AppError('Debe indicar la contraseña actual y la nueva.', 400);
    }

    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
        throw new AppError('Usuario no encontrado.', 404);
    }

    const esCorrecta = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!esCorrecta) {
        throw new AppError('La contraseña actual no coincide.', 400);
    }

    const politica = validarPassword(nueva_password);
    if (!politica.valida) {
        throw new AppError(politica.mensaje, 400);
    }

    if (nueva_password === password_actual) {
        throw new AppError('La nueva contraseña debe ser diferente de la actual.', 400);
    }

    usuario.password_hash = await hashPassword(nueva_password);
    // Invalida todos los tokens emitidos antes de este momento (incluido el actual)
    usuario.password_changed_at = new Date();
    await usuario.save();

    // Se entrega un token nuevo para que la sesión actual continúe sin volver a iniciar sesión
    return res.status(200).json({
        mensaje: 'Contraseña actualizada exitosamente.',
        token: generarJwt(usuario)
    });
});
