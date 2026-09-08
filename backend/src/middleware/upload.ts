import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Store in memory buffer so plaintext never touches disk unencrypted
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'jpg',
  'jpeg',
  'png',
  'txt',
]);

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error(`Unsupported file type (.${ext}). Only verified documents and images are permitted.`));
    }
    cb(null, true);
  },
});

/**
 * Validates file magic bytes to prevent MIME spoofing and executable uploads
 */
export function validateMagicBytes(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const buffer = req.file.buffer;
  if (!buffer || buffer.length === 0) {
    return res.status(400).json({ error: 'Empty file payload rejected.' });
  }

  // Sanitize filename
  req.file.originalname = req.file.originalname
    .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
    .replace(/\.{2,}/g, '.');

  const ext = req.file.originalname.split('.').pop()?.toLowerCase() || '';

  // Check magic signatures
  if (ext === 'pdf') {
    const header = buffer.subarray(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      return res.status(400).json({ error: 'File integrity rejected: PDF header signature does not match %PDF- magic bytes.' });
    }
  } else if (ext === 'png') {
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
      return res.status(400).json({ error: 'File integrity rejected: PNG magic byte signature mismatch.' });
    }
  } else if (ext === 'jpg' || ext === 'jpeg') {
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return res.status(400).json({ error: 'File integrity rejected: JPEG magic byte signature mismatch.' });
    }
  } else if (['docx', 'xlsx', 'pptx'].includes(ext)) {
    // PK zip signature (0x50, 0x4B, 0x03, 0x04)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
      return res.status(400).json({ error: 'File integrity rejected: Office OpenXML container signature mismatch.' });
    }
  }

  // Reject executable Windows/Linux binaries (.exe, .bat, .ps1, .sh, ELF, PE)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    // "MZ" DOS/Windows PE header
    return res.status(400).json({ error: 'Executable binary signature (MZ) detected. Upload rejected for security.' });
  }
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    // "\x7fELF" Linux binary
    return res.status(400).json({ error: 'Executable ELF binary signature detected. Upload rejected for security.' });
  }

  next();
}
