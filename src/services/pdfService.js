const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Genera el PDF oficial GCCON-F-088 e inyecta hashes y firma.
// Devuelve la ruta del archivo. La imagen de firma se destruye de la RAM
// (sobreescritura del buffer con ceros) por seguridad biométrica (Flujo 4).
const generarPdf = async ({ contrato, bienes = [], firmas = [], firma_base64 = null }) => {
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
  doc.text(`Dependencia: ${contrato.dependencia || 'N/A'}`);
  doc.text(`Estado final: ${contrato.estado}`);
  doc.moveDown();

  // Lista de bienes
  doc.fontSize(12).text('Inventario de bienes:');
  bienes.forEach((b, i) => {
    doc.text(`${i + 1}. ${b.descripcion} - ${b.codigo_inventario} - Estado: ${b.estado_bien}`);
  });

  doc.moveDown();
  doc.text('Hashes de verificación por área:');

  firmas.forEach(f => {
    const nombreArea = f.area_id?.nombre_dependencia || f.area_id;
    doc.text(`Área: ${nombreArea} - Estado: ${f.estado} - Hash: ${f.hash_verificacion || 'N/A'}`);
  });

  // Incluir imagen de la firma si fue enviada, y destruirla de la RAM
  if (firma_base64) {
    try {
      const imgBuffer = Buffer.from(firma_base64, 'base64');
      doc.addPage();
      doc.fontSize(12).text('Imagen de firma (responsable de área):');
      doc.image(imgBuffer, { fit: [250, 150] });
      // Destrucción biométrica: sobreescribir el buffer con ceros y anular referencia
      imgBuffer.fill(0);
      firma_base64 = null;
    } catch (e) {
      console.error('Error al insertar imagen en PDF:', e.message);
    }
  }

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filepath;
};

module.exports = { generarPdf };
