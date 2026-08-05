const Usuario = require('../models/Usuario'); // Importa tu modelo de Usuario
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { correo_institucional, password } = req.body;

        // 1. Validar que vengan los campos obligatorios
        if (!correo_institucional || !password) {
            return res.status(400).json({ 
                mensaje: 'Por favor, ingrese correo institucional y contraseña.' 
            });
        }

        // 2. Buscar usuario en la colección 'usuarios' de MongoDB
        const usuario = await Usuario.findOne({ correo_institucional });
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales inválidas.' });
        }


        // 3. Verificar si el usuario está inactivo por el Admin
        if (usuario.activo === false) {
            return res.status(401).json({ 
                mensaje: 'Usuario deshabilitado. Contacte al administrador.' 
            });
        }

        const ahora = new Date();

        // 4. Verificar si la cuenta está bloqueada temporalmente
        if (usuario.bloqueado_hasta && ahora < usuario.bloqueado_hasta) {
            const minutosRestantes = Math.ceil((usuario.bloqueado_hasta - ahora) / (1000 * 60));
            return res.status(403).json({ 
                mensaje: `Cuenta bloqueada por intentos fallidos. Intente de nuevo en ${minutosRestantes} minuto(s).` 
            });
        }

        // 5. Validar la contraseña con Bcrypt
        const esCorrecta = await bcrypt.compare(password, usuario.password_hash);

        if (!esCorrecta) {
            // Incrementar contador de intentos fallidos
            usuario.intentos_fallidos = (usuario.intentos_fallidos || 0) + 1;

            // Verificar si alcanzó el límite de 3 intentos
            if (usuario.intentos_fallidos >= 3) {
                // Establecer bloqueo por 15 minutos
                usuario.bloqueado_hasta = new Date(ahora.getTime() + 15 * 60 * 1000);
                usuario.intentos_fallidos = 0; // Resetear contador al aplicar el bloqueo
                await usuario.save();

                return res.status(403).json({ 
                    mensaje: 'Ha superado los 3 intentos fallidos. Cuenta bloqueada por 15 minutos.' 
                });
            }

            await usuario.save();
            return res.status(401).json({ 
                mensaje: `Credenciales inválidas. Intentos fallidos: ${usuario.intentos_fallidos}/3` 
            });
        }
console.log("ass correcto");

        // 6. Si la contraseña es correcta: Resetear contadores de bloqueo
        usuario.intentos_fallidos = 0;
        usuario.bloqueado_hasta = null;
        await usuario.save();

        // 7. Generar Token JWT con ID y Rol del usuario
        const payload = {
            id: usuario._id,
            nombre: usuario.nombre_completo,
            correo: usuario.correo_institucional,
            rol: usuario.rol
        };

        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'secreto_sena_pazysalvo', 
            { expiresIn: '8h' }
        );
console.log("abd",token);

        // 8. Responder con estado HTTP 200 y entregar el token + rol
        return res.status(200).json({
            mensaje: 'Inicio de sesión exitoso.',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre_completo,
                correo: usuario.correo_institucional,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor en el servidor.' });
    }
};