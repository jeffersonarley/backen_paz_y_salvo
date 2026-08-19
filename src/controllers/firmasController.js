const Contrato = require('../models/Contrato');
const TrazabilidadFirma = require('../models/TrazabilidadFirma');
const BienEntregado = require('../models/BienEntregado');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.procesarFirma = async (req, res) => {
  try {
    const { contratoId, accion, firma_base64, observacion_rechazo } = req.body;

    if (!contratoId || !accion) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios: contratoId o accion.' });
    }

    // Validar rol: ResponsableArea o Administrador puede procesar
    const rol = req.usuario?.rol;
    if (!['ResponsableArea', 'Administrador', 'Supervisor'].includes(rol)) {
      return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol ResponsableArea o Administrador.' });
    }

    // Buscar contrato
    const contrato = await Contrato.findById(contratoId);
    if (!contrato) return res.status(404).json({ mensaje: 'Contrato no encontrado.' });

    // Determinar área del usuario (se asume que el usuario tiene dependencia_id)
    const areaId = req.usuario?.dependencia_id;
    if (!areaId) return res.status(403).json({ mensaje: 'No se pudo identificar el área del usuario.' });

    // Buscar trazabilidad para este contrato y área en estado Pendiente
    const traz = await TrazabilidadFirma.findOne({ contrato_id: contrato._id, area_id: areaId });
    if (!traz) return res.status(400).json({ mensaje: 'No existe un registro de firma para esta área y contrato.' });

    if (traz.estado !== 'Pendiente') {
      return res.status(400).json({ mensaje: `Esta área ya realizó su acción: ${traz.estado}` });
    }

    // Manejar rechazo
    if (accion === 'Rechazar' || accion === 'rechazar' || accion === 'RECHAZAR') {
      if (!observacion_rechazo) {
        return res.status(400).json({ mensaje: 'Debe indicar una observación al rechazar.' });
      }

      traz.estado = 'Rechazado';
      traz.observacion_rechazo = observacion_rechazo;
      traz.usuario_id = req.usuario.id || req.usuario._id || req.usuario.uid;
      traz.fecha_firma = new Date();
      await traz.save();

      // Notificar al contratista por correo
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: contrato.correo_contratista,
          subject: `Paz y Salvo Rechazado - Contrato ${contrato.numero_contrato}`,
          text: `Su trámite fue rechazado por el área. Motivo: ${traz.observacion_rechazo}`
        });
      } catch (e) {
        console.error('Error enviando correo de rechazo:', e.message);
      }

      return res.status(200).json({ mensaje: 'Firma procesada: Rechazado', contrato });
    }

    // Manejar aprobación
    if (accion === 'Aprobar' || accion === 'aprobar' || accion === 'APROBAR') {
      // Generar hash SHA-256
      const hash = crypto.createHash('sha256')
        .update(`${contrato._id}:${req.usuario.id || req.usuario._id || req.usuario.uid}:${Date.now()}`)
        .digest('hex');

      traz.estado = 'Aprobado';
      traz.usuario_id = req.usuario.id || req.usuario._id || req.usuario.uid;
      traz.fecha_firma = new Date();
      traz.hash_verificacion = hash;
      await traz.save();

      // Contar firmas pendientes
      const pendientes = await TrazabilidadFirma.countDocuments({ contrato_id: contrato._id, estado: 'Pendiente' });

      if (pendientes > 0) {
        return res.status(200).json({ mensaje: 'Firma aprobada. Aún quedan firmas pendientes.', pendientes });
      }

      // Si no quedan firmas pendientes, finalizar contrato y generar PDF
      contrato.estado = 'Finalizado';
      await contrato.save();

      // Generar PDF con PDFKit
      const bienes = await BienEntregado.find({ contrato: contrato._id });

      const tmpDir = path.join(__dirname, '../../tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const filename = `pazysalvo_${contrato._id}.pdf`;
      const filepath = path.join(tmpDir, filename);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Cabecera
      doc.fontSize(16).text('GCCON-F-088 - Paz y Salvo', { align: 'center' });
      doc.moveDown();

      // Datos del contrato
      doc.fontSize(12).text(`Número de contrato: ${contrato.numero_contrato}`);
      doc.text(`Contratista: ${contrato.nombre_contratista} (${contrato.correo_contratista})`);
      doc.text(`Dependencia: ${contrato.dependencia}`);
      doc.text(`Estado final: ${contrato.estado}`);
      doc.moveDown();

      // Lista de bienes
      doc.fontSize(12).text('Inventario de bienes:');
      bienes.forEach((b, i) => {
        doc.text(`${i + 1}. ${b.descripcion} - ${b.codigo_inventario} - Estado: ${b.estado_bien}`);
      });

      doc.moveDown();
      doc.text('Hashes de verificación por área:');

      // Incluir hashes
      const firmas = await TrazabilidadFirma.find({ contrato_id: contrato._id });
      firmas.forEach(f => {
        doc.text(`Área: ${f.area_id} - Estado: ${f.estado} - Hash: ${f.hash_verificacion || 'N/A'}`);
      });

      // Incluir imagen de la última firma si se envió
      if (firma_base64) {
        try {
          const imgBuffer = Buffer.from(firma_base64, 'base64');
          doc.addPage();
          doc.fontSize(12).text('Imagen de firma (responsable de área):');
          doc.image(imgBuffer, { fit: [250, 150] });
          // destruir buffer
          // overwrite variable
          // eslint-disable-next-line no-param-reassign
          req.body.firma_base64 = null;
        } catch (e) {
          console.error('Error al insertar imagen en PDF:', e.message);
        }
      }

      doc.end();

      // Esperar a que se escriba el archivo
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Enviar correo con PDF adjunto al contratista
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: contrato.correo_contratista,
          subject: `Paz y Salvo Finalizado - Contrato ${contrato.numero_contrato}`,
          text: `Su paz y salvo ha finalizado. Adjunto encontrará el documento.`,
          attachments: [{ filename, path: filepath }]
        });
      } catch (e) {
        console.error('Error enviando correo con PDF:', e.message);
      }

      return res.status(200).json({ mensaje: 'Contrato finalizado, PDF generado y notificación enviada.', pdf_path: filepath });
    }

    return res.status(400).json({ mensaje: 'Acción no reconocida. Use "Aprobar" o "Rechazar".' });

  } catch (error) {
    console.error('Error en procesarFirma:', error);
    return res.status(500).json({ mensaje: 'Error interno al procesar la firma.', error: error.message });
  }
};
