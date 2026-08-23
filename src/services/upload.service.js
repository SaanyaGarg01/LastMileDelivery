const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../client/public/uploads/items');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class UploadService {
  /**
   * Save a base64 encoded image string to local disk storage
   */
  static saveItemImage(base64Data, filenamePrefix = 'item') {
    if (!base64Data) return null;

    try {
      // Remove header if present (e.g. data:image/png;base64,)
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let imageBuffer;
      let extension = 'png';

      if (matches && matches.length === 3) {
        extension = matches[1].split('/')[1] || 'png';
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        imageBuffer = Buffer.from(base64Data, 'base64');
      }

      const filename = `${filenamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filePath, imageBuffer);
      return `/uploads/items/${filename}`;
    } catch (err) {
      console.error('[UploadService] Error saving image:', err);
      return null;
    }
  }
}

module.exports = UploadService;
