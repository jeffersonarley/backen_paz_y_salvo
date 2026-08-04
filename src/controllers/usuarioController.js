const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

// Crear un nuevo usuario (Supervisor, Aprendiz, etc.)
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre_completo, correo_institucional, password, rol, dependencia_id, telefono } = req.body;

    // 1. Validar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ correo_institucional });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El correo institucional ya está registrado.' });
    }

    // 2. Hashear la contraseña con Bcrypt
    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Crear el documento
    const nuevoUsuario = new Usuario({
      nombre_completo,
      correo_institucional,
      password_hash,
      rol,
      dependencia_id: dependencia_id || null,
      telefono
    });

    await nuevoUsuario.save();

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente.',
      usuario: {
        id: nuevoUsuario._id,
        nombre_completo: nuevoUsuario.nombre_completo,
        correo_institucional: nuevoUsuario.correo_institucional,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear usuario.', error: error.message });
  }
};

// Consultar todos los usuarios
exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, '-password_hash'); // Excluye el hash por seguridad
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios.', error: error.message });
  }
};