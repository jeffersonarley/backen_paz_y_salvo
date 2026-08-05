const Contrato = require('../models/Contrato');
const BienEntregado = require('../models/BienEntregado');

exports.crearContrato = async (req, res) => {
  try {
    const { numero, telefono, dependencia, bienes } = req.body;

    // 1. Extraer ID del usuario desde el token autenticado
    const usuarioId = req.usuario?.id || req.usuario?._id || req.usuario?.uid;

    if (!usuarioId) {
      return res.status(401).json({ mensaje: 'No se pudo identificar al usuario autenticado.' });
    }

    // 2. Validaciones básicas de campos obligatorios
    if (!numero || !telefono || !dependencia) {
      return res.status(400).json({ mensaje: 'Todos los campos obligatorios del contrato (numero, telefono, dependencia) deben estar diligenciados.' });
    }

    if (!bienes || !Array.isArray(bienes) || bienes.length === 0) {
      return res.status(400).json({ mensaje: 'Debe incluir al menos un bien en el inventario.' });
    }

    // 3. Crear y guardar el Contrato en MongoDB
    const nuevoContrato = new Contrato({
      numero_contrato: numero,
      nombre_contratista: req.usuario.nombre_completo || req.usuario.nombre || 'Contratista',
      correo_contratista: req.usuario.correo_institucional || req.usuario.correo || req.usuario.email,
      telefono,
      dependencia,
      usuario: usuarioId,
      estado: 'Borrador'
    });

    await nuevoContrato.save();

    // 4. Mapear e insertar los bienes asociando el _id del contrato guardado
    const bienesConContrato = bienes.map(bien => ({
      descripcion: bien.descripcion || bien.nombre,
      codigo_inventario: bien.codigo_inventario || bien.codigo || bien.placa,
      estado_bien: bien.estado_bien || 'Bueno',
      contrato: nuevoContrato._id
    }));

    await BienEntregado.insertMany(bienesConContrato);

    // 5. Respuesta exitosa
    return res.status(201).json({
      mensaje: 'Registro contractual e inventario creado exitosamente en estado Borrador.',
      contrato: nuevoContrato
    });

  } catch (error) {
    console.error('Error al registrar contrato:', error);
    return res.status(500).json({ 
      mensaje: 'Error interno del servidor al procesar el contrato.',
      error: error.message 
    });
  }
};