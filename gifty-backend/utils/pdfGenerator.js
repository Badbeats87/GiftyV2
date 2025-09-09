const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const generateInvoice = async (invoiceData, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    doc.fontSize(25).text('Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice ID: ${invoiceData.invoiceId}`);
    doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`);
    doc.text(`Business: ${invoiceData.businessName}`);
    doc.text(`Business Email: ${invoiceData.businessEmail}`);
    doc.moveDown();

    doc.text('--- Details ---');
    doc.text(`Total Sales: ${invoiceData.currency} ${invoiceData.totalSales.toFixed(2)}`);
    doc.text(`Platform Fees: ${invoiceData.currency} ${invoiceData.platformFees.toFixed(2)}`);
    doc.text(`Net Payout: ${invoiceData.currency} ${invoiceData.netPayout.toFixed(2)}`);
    doc.moveDown();

    doc.text('--- Transactions ---');
    invoiceData.transactions.forEach(transaction => {
      doc.text(`- ${transaction.type}: ${transaction.description} - ${transaction.currency} ${transaction.amount.toFixed(2)}`);
    });
    doc.moveDown();

    doc.text('Thank you for using Gifty!', { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      logger.info(`Invoice ${invoiceData.invoiceId} generated successfully at ${outputPath}`);
      resolve(outputPath);
    });

    stream.on('error', (error) => {
      logger.error(`Error generating invoice ${invoiceData.invoiceId}: ${error.message}`);
      reject(error);
    });
  });
};

module.exports = { generateInvoice };
