const Contrato = require('../models/Contrato');
const DependenciaArea = require('../models/DependenciaArea');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const nodemailer = require('nodemailer');

exports.evaluarContrato = async (req, res) => {
  try {
    const { id } = req.params;
    const { aprobado, observaciones_supervisor } = req.body;

    // 1. Validar rol de Supervisor o Admin
    if (req.usuario.rol !== 'Supervisor' && req.usuario.rol !== 'Administrador') {
      return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de Supervisor.' });
    }

    // 2. Buscar contrato en MongoDB
    const contrato = await Contrato.findById(id);
    if (!contrato) {
      return res.status(404).json({ mensaje: 'Contrato no encontrado.' });
    }

    // 2.1 Validar que el supervisor autenticado sea el asignado al contrato (si existe)
    // Los Administradores pueden omitir esta verificación
    if (req.usuario.rol === 'Supervisor') {
      if (contrato.supervisor) {
        const supervisorId = contrato.supervisor.toString();
        const usuarioId = req.usuario.id || req.usuario._id || req.usuario.uid;
        if (supervisorId !== usuarioId.toString()) {
          return res.status(403).json({ mensaje: 'Acceso denegado. No estás asignado como supervisor de este contrato.' });
        }
      } else {
        // Si no hay supervisor asignado, denegar la acción para evitar que supervisores no asignados actúen
        return res.status(403).json({ mensaje: 'Acceso denegado. Este contrato no tiene un supervisor asignado.' });
      }
    }

    // 3. Evaluar veredicto (Aprobado / Rechazado)
    if (aprobado === false) {
      // --- RECHAZADO ---
      contrato.estado = 'Borrador';
      contrato.observaciones_supervisor = observaciones_supervisor || 'Rechazado por el supervisor.';
      await contrato.save();

      // Envío de correo opcional vía Nodemailer
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: contrato.correo_contratista,
          subject: `Paz y Salvo Rechazado - Contrato ${contrato.numero_contrato}`,
          text: `Estimado(a) ${contrato.nombre_contratista},\n\nSu paz y salvo requiere observaciones:\n"${contrato.observaciones_supervisor}"`
        });
      } catch (e) {
        console.error('Error enviando correo:', e.message);
      }

      return res.status(200).json({
        mensaje: 'Contrato rechazado exitosamente. Retornado a estado Borrador.',
        contrato
      });

    } else if (aprobado === true) {
      // --- APROBADO ---
      contrato.estado = 'Pendiente de Firmas';
      await contrato.save();

      // Apertura de casilleros de firma por área
      const areasActivas = await DependenciaArea.find({ activa: true });

      if (areasActivas.length > 0) {
        const casillerosFirmas = areasActivas.map(area => ({
          contrato: contrato._id,
          area: area._id,
          nombre_area: area.nombre_dependencia, // <--- Actualizado para coincidir con tu BD
          estado_firma: 'Pendiente',
          hash_verificacion: ''
        }));

        await TrazabilidadFirma.insertMany(casillerosFirmas);
      }

      return res.status(200).json({
        mensaje: 'Contrato aprobado por el supervisor. Firma de áreas aperturada.',
        contrato
      });

    } else {
      return res.status(400).json({ mensaje: 'El campo "aprobado" debe ser true o false.' });
    }

  } catch (error) {
    console.error('Error al evaluar contrato:', error);
    return res.status(500).json({ mensaje: 'Error en el servidor al evaluar contrato.', error: error.message });
  }
};