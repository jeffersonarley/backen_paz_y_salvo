const PDFDocument = require('pdfkit');

// Genera el PDF oficial GCCON-F-088 EN MEMORIA y devuelve un Buffer.
// (No se escribe en disco: en Vercel/serverless el sistema de archivos es de solo lectura
// y los archivos temporales no se comparten entre instancias.)
// `firma` es un Buffer de imagen (PNG/JPEG) ya validado con utils/firma.js, o null.
const generarPdf = ({ contrato, bienes = [], firmas = [], firma = null }) => new Promise((resolve, reject) => {
  const doc = new PDFDocument();
  const partes = [];

  doc.on('data', (parte) => partes.push(parte));
  doc.on('end', () => resolve(Buffer.concat(partes)));
  doc.on('error', reject);

  try {
    // Cabecera
    doc.fontSize(16).text('GCCON-F-088 - Paz y Salvo', { align: 'center' });
    doc.moveDown();

    // Datos del contrato (la dependencia debe venir "populada"; si no, se muestra el id)
    const nombreDependencia = contrato.dependencia?.nombre_dependencia || contrato.dependencia || 'N/A';
    doc.fontSize(12).text(`Número de contrato: ${contrato.numero_contrato}`);
    doc.text(`Contratista: ${contrato.nombre_contratista} (${contrato.correo_contratista})`);
    doc.text(`Dependencia: ${nombreDependencia}`);
    doc.text(`Estado final: ${contrato.estado}`);
    doc.moveDown();

    // Lista de bienes
    doc.fontSize(12).text('Inventario de bienes:');
    bienes.forEach((b, i) => {
      doc.text(`${i + 1}. ${b.descripcion} - ${b.codigo_inventario} - Cantidad: ${b.cantidad} - Estado: ${b.estado_bien}`);
    });

    doc.moveDown();
    doc.text('Firmas de verificación por área:');

    firmas.forEach((f) => {
      const nombreArea = f.area_id?.nombre_dependencia || f.area_id;
      doc.text(`Área: ${nombreArea} - Estado: ${f.estado} - Hash: ${f.hash_verificacion || 'N/A'}`);
    });

    if (firma) {
      doc.addPage();
      doc.fontSize(12).text('Imagen de firma (responsable de área):');
      doc.image(firma, { fit: [250, 150] });
    }

    doc.end();
  } catch (error) {
    reject(error);
  }
});

module.exports = { generarPdf };
