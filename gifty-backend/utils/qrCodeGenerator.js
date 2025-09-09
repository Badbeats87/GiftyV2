const QRCode = require('qrcode');
const logger = require('./logger');

/**
 * Generates a QR code as a data URL for the given text.
 * @param {string} text The text to encode in the QR code (e.g., gift card unique code).
 * @returns {Promise<string>} A promise that resolves with the QR code data URL.
 */
const generateQRCode = async (text) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text);
    logger.info('QR code generated successfully.');
    return qrCodeDataUrl;
  } catch (error) {
    logger.error(`Error generating QR code: ${error.message}`);
    throw new Error('Failed to generate QR code.');
  }
};

module.exports = {
  generateQRCode,
};
