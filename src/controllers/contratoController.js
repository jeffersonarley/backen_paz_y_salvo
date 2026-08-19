const mongoose = require('mongoose');
const Contrato = require('../models/Contrato');
const BienEntregado = require('../models/BienEntregado');

exports.crearContrato = async (req, res) => {
  const session = await mongoose.startSession();
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

    // Preparar datos
    const nuevoContrato = new Contrato({
      numero_contrato: numero,
      nombre_contratista: req.usuario.nombre_completo || req.usuario.nombre || 'Contratista',
      correo_contratista: req.usuario.correo_institucional || req.usuario.correo || req.usuario.email,
      telefono,
      dependencia,
      usuario: usuarioId,
      estado: 'Borrador'
    });

    const bienesConContrato = bienes.map(bien => ({
      descripcion: bien.descripcion || bien.nombre,
      codigo_inventario: bien.codigo_inventario || bien.codigo || bien.placa,
      estado_bien: bien.estado_bien || 'Bueno',
      contrato: nuevoContrato._id
    }));

    // 3. Intentar transacción atómica (requiere replica set en MongoDB)
    try {
      await session.withTransaction(async () => {
        await nuevoContrato.save({ session });
        await BienEntregado.insertMany(bienesConContrato, { session });
      });
      session.endSession();

      return res.status(201).json({
        mensaje: 'Registro contractual e inventario creado exitosamente en estado Borrador.',
        contrato: nuevoContrato
      });
    } catch (txError) {
      // Si las transacciones no son soportadas (standalone) o fallan, hacemos fallback
      console.warn('Transacción fallida o no soportada, intentando fallback:', txError.message);
      session.endSession();

      // Fallback secuencial con compensación manual
      try {
        await nuevoContrato.save();
        await BienEntregado.insertMany(bienesConContrato);

        return res.status(201).json({
          mensaje: 'Registro contractual e inventario creado (fallback secuencial).',
          contrato: nuevoContrato
        });
      } catch (fallbackErr) {
        // Intentar eliminar contrato creado si hubo falla al insertar bienes
        try {
          await Contrato.findByIdAndDelete(nuevoContrato._id);
        } catch (cleanupErr) {
          console.error('Error en limpieza tras fallo fallback:', cleanupErr.message);
        }

        console.error('Error en fallback al registrar contrato:', fallbackErr);
        return res.status(500).json({
          mensaje: 'Error interno del servidor al procesar el contrato (fallback).',
          error: fallbackErr.message
        });
      }
    }

  } catch (error) {
    console.error('Error al registrar contrato:', error);
    try { session.endSession(); } catch (e) {}
    return res.status(500).json({ 
      mensaje: 'Error interno del servidor al procesar el contrato.',
      error: error.message 
    });
  }
};