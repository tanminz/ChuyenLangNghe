const fs = require('fs');
const path = require('path');

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function parseDataImage(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (!match) return null;
  const mimeSubtype = match[1].toLowerCase();
  const base64 = match[2];
  const ext = mimeSubtype === 'jpeg' ? 'jpg' : mimeSubtype.replace(/[^a-z0-9]/g, '');
  return { ext, base64 };
}

function isLikelyUrl(str) {
  if (typeof str !== 'string') return false;
  return str.startsWith('/uploads/') || str.startsWith('http://') || str.startsWith('https://') || str.startsWith('assets/');
}

/**
 * If image is a data URL, persist it as a file and return a URL path.
 * If already a URL (or empty), returns as-is.
 */
function persistProductImageMaybe(dataOrUrl, { productId, field, uploadDirAbs, publicUrlBase = '/uploads/products' }) {
  if (!dataOrUrl) return '';
  if (typeof dataOrUrl !== 'string') return '';
  if (isLikelyUrl(dataOrUrl)) return dataOrUrl;

  const parsed = parseDataImage(dataOrUrl);
  if (!parsed) {
    // Reject unknown formats (we only support data:image/* or URL)
    return null;
  }

  ensureDirSync(uploadDirAbs);
  const fileName = `${String(productId)}-${field}-${Date.now()}.${parsed.ext || 'png'}`;
  const absPath = path.join(uploadDirAbs, fileName);
  const buf = Buffer.from(parsed.base64, 'base64');
  fs.writeFileSync(absPath, buf);
  return `${publicUrlBase}/${fileName}`;
}

module.exports = {
  ensureDirSync,
  parseDataImage,
  persistProductImageMaybe,
};

