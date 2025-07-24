import PDFDocument from 'pdfkit';
import { get } from '@netlify/blobs';

export async function handler(event) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});
  doc.fontSize(20).text('Amazon WHS SIFA Audit Report', { align: 'center' });
  doc.moveDown();
  doc.end();
  await new Promise(resolve => doc.on('end', resolve));
  const pdfData = Buffer.concat(buffers);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/pdf' },
    body: pdfData.toString('base64'),
    isBase64Encoded: true
  };
}