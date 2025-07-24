const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

exports.handler = async (event) => {
  const doc = new PDFDocument();
  const buffers = [];

  doc.text("Amazon WHS SIFA Audit Report");
  doc.text("Generated at: " + new Date().toISOString());

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  doc.end();

  await new Promise((resolve) => doc.on('end', resolve));

  const pdfData = Buffer.concat(buffers);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="audit.pdf"',
    },
    body: pdfData.toString('base64'),
    isBase64Encoded: true
  };
};