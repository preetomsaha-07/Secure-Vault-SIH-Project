const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg");

const authenticateToken = require("../middleware/authMiddleware");
const {
  authorizePermission,
} = require("../middleware/permissionMiddleware");

const { createAuditLog } = require("../utils/auditLogger");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/*
|--------------------------------------------------------------------------
| FOLDERS
|--------------------------------------------------------------------------
*/

const uploadDir = path.join(__dirname, "..", "uploads");
const tempDir = path.join(uploadDir, "temp");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, {
    recursive: true,
  });
}

/*
|--------------------------------------------------------------------------
| FILE SECURITY CONFIGURATION
|--------------------------------------------------------------------------
*/

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/*
|--------------------------------------------------------------------------
| ALLOWED FILE TYPES
|--------------------------------------------------------------------------
|
| Only common document/image/text formats are accepted.
| Executable/script files are intentionally excluded.
|
*/

const ALLOWED_FILE_TYPES = {
  ".pdf": [
    "application/pdf",
  ],

  ".txt": [
    "text/plain",
  ],

  ".csv": [
    "text/csv",
    "application/csv",
  ],

  ".doc": [
    "application/msword",
  ],

  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  ".xls": [
    "application/vnd.ms-excel",
  ],

  ".xlsx": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],

  ".jpg": [
    "image/jpeg",
  ],

  ".jpeg": [
    "image/jpeg",
  ],

  ".png": [
    "image/png",
  ],

  ".gif": [
    "image/gif",
  ],

  ".webp": [
    "image/webp",
  ],
};

/*
|--------------------------------------------------------------------------
| DISALLOWED EXTENSIONS
|--------------------------------------------------------------------------
| Extra protection against executable/script uploads.
|--------------------------------------------------------------------------
*/

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".dll",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".scr",
  ".sh",
  ".bash",
  ".ps1",
  ".vbs",
  ".vbe",
  ".js",
  ".mjs",
  ".cjs",
  ".jar",
  ".php",
  ".py",
  ".rb",
  ".pl",
  ".cgi",
  ".html",
  ".htm",
  ".svg",
]);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/*
 * Sanitize the original filename only for database/display purposes.
 * Actual server storage uses a random filename.
 */
function sanitizeOriginalFilename(filename) {
  if (!filename) {
    return "document";
  }

  const originalName = String(filename);

  // Remove control characters.
  let safeName = originalName.replace(
    /[\u0000-\u001F\u007F]/g,
    ""
  );

  // Normalize Windows path separators.
  safeName = safeName.replace(/\\/g, "/");

  // Keep only the final filename component.
  safeName = path.basename(safeName);

  // Replace suspicious characters.
  safeName = safeName.replace(
    /[^a-zA-Z0-9._()\- \[\]]/g,
    "_"
  );

  // Remove repeated spaces.
  safeName = safeName.replace(/\s+/g, " ").trim();

  if (!safeName) {
    safeName = "document";
  }

  // Limit display filename length.
  return safeName.slice(0, 180);
}

/*
 * Get safe extension.
 */
function getSafeExtension(filename) {
  return path
    .extname(filename || "")
    .toLowerCase();
}

/*
 * Validate extension + MIME type.
 */
function isAllowedFileType(file) {
  const extension = getSafeExtension(
    file.originalname
  );

  if (!extension) {
    return false;
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return false;
  }

  if (!Object.prototype.hasOwnProperty.call(
    ALLOWED_FILE_TYPES,
    extension
  )) {
    return false;
  }

  const allowedMimeTypes =
    ALLOWED_FILE_TYPES[extension];

  return allowedMimeTypes.includes(
    file.mimetype
  );
}

/*
|--------------------------------------------------------------------------
| MULTER STORAGE
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },

  filename: (req, file, cb) => {
    const extension = getSafeExtension(
      file.originalname
    );

    const tempName =
      `upload-${Date.now()}-` +
      `${crypto.randomBytes(16).toString("hex")}` +
      `${extension}`;

    cb(null, tempName);
  },
});

/*
|--------------------------------------------------------------------------
| MULTER FILE FILTER
|--------------------------------------------------------------------------
*/

const multerFileFilter = (req, file, cb) => {
  try {
    const extension = getSafeExtension(
      file.originalname
    );

    if (!extension) {
      return cb(
        new Error(
          "File extension is required."
        )
      );
    }

    if (BLOCKED_EXTENSIONS.has(extension)) {
      return cb(
        new Error(
          "Executable or script files are not allowed."
        )
      );
    }

    if (!isAllowedFileType(file)) {
      return cb(
        new Error(
          "This file type is not allowed."
        )
      );
    }

    cb(null, true);
  } catch (error) {
    cb(error);
  }
};

/*
|--------------------------------------------------------------------------
| MULTER CONFIGURATION
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 10,
  },

  fileFilter: multerFileFilter,
});

/*
|--------------------------------------------------------------------------
| MULTER ERROR HANDLER
|--------------------------------------------------------------------------
|
| Multer errors happen before the main route handler, so they are
| handled using a dedicated middleware wrapper.
|
*/

const handleUpload = (req, res, next) => {
  upload.single("document")(
    req,
    res,
    (error) => {
      if (error) {
        console.error(
          "UPLOAD VALIDATION ERROR:",
          error.message
        );

        if (
          req.file?.path &&
          fs.existsSync(req.file.path)
        ) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error(
              "UPLOAD CLEANUP ERROR:",
              cleanupError.message
            );
          }
        }

        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
              success: false,
              message:
                "File is too large. Maximum allowed size is 10 MB.",
            });
          }

          return res.status(400).json({
            success: false,
            message:
              `Upload error: ${error.message}`,
          });
        }

        return res.status(400).json({
          success: false,
          message: error.message ||
            "Invalid file upload.",
        });
      }

      next();
    }
  );
};

/*
|--------------------------------------------------------------------------
| ENCRYPTION KEY
|--------------------------------------------------------------------------
*/

function getEncryptionKey() {
  const keyHex =
    process.env.FILE_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      "FILE_ENCRYPTION_KEY is missing in .env"
    );
  }

  if (
    !/^[0-9a-fA-F]{64}$/.test(keyHex)
  ) {
    throw new Error(
      "FILE_ENCRYPTION_KEY must be exactly 64 hexadecimal characters"
    );
  }

  return Buffer.from(keyHex, "hex");
}

/*
|--------------------------------------------------------------------------
| ENCRYPT FILE
|--------------------------------------------------------------------------
*/

function encryptFile(
  inputPath,
  outputPath
) {
  return new Promise(
    (resolve, reject) => {
      try {
        const key =
          getEncryptionKey();

        const iv =
          crypto.randomBytes(12);

        const cipher =
          crypto.createCipheriv(
            "aes-256-gcm",
            key,
            iv
          );

        const input =
          fs.createReadStream(inputPath);

        const output =
          fs.createWriteStream(outputPath);

        let finished = false;

        const fail = (error) => {
          if (finished) {
            return;
          }

          finished = true;
          reject(error);
        };

        input.on("error", fail);
        output.on("error", fail);
        cipher.on("error", fail);

        output.on(
          "finish",
          () => {
            if (finished) {
              return;
            }

            try {
              finished = true;

              const authTag =
                cipher.getAuthTag();

              resolve({
                iv: iv.toString("hex"),
                authTag:
                  authTag.toString("hex"),
              });
            } catch (error) {
              reject(error);
            }
          }
        );

        input
          .pipe(cipher)
          .pipe(output);
      } catch (error) {
        reject(error);
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| DECRYPT FILE
|--------------------------------------------------------------------------
*/

function decryptFile(
  inputPath,
  outputPath,
  ivHex,
  authTagHex
) {
  return new Promise(
    (resolve, reject) => {
      try {
        const key =
          getEncryptionKey();

        if (
          !/^[0-9a-fA-F]+$/.test(ivHex) ||
          !/^[0-9a-fA-F]+$/.test(authTagHex)
        ) {
          throw new Error(
            "Invalid encryption metadata."
          );
        }

        const iv =
          Buffer.from(ivHex, "hex");

        const authTag =
          Buffer.from(
            authTagHex,
            "hex"
          );

        if (iv.length !== 12) {
          throw new Error(
            "Invalid encryption IV."
          );
        }

        if (authTag.length !== 16) {
          throw new Error(
            "Invalid encryption authentication tag."
          );
        }

        const decipher =
          crypto.createDecipheriv(
            "aes-256-gcm",
            key,
            iv
          );

        decipher.setAuthTag(
          authTag
        );

        const input =
          fs.createReadStream(inputPath);

        const output =
          fs.createWriteStream(outputPath);

        let finished = false;

        const fail = (error) => {
          if (finished) {
            return;
          }

          finished = true;
          reject(error);
        };

        input.on("error", fail);
        output.on("error", fail);
        decipher.on("error", fail);

        output.on(
          "finish",
          () => {
            if (finished) {
              return;
            }

            finished = true;
            resolve();
          }
        );

        input
          .pipe(decipher)
          .pipe(output);
      } catch (error) {
        reject(error);
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| SAFE FILE CLEANUP
|--------------------------------------------------------------------------
*/

function deleteFileSafely(filePath) {
  if (
    filePath &&
    fs.existsSync(filePath)
  ) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(
        "FILE CLEANUP ERROR:",
        error.message
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| TEST ROUTE
|--------------------------------------------------------------------------
*/

router.get(
  "/test",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Document routes are loaded correctly!",
    });
  }
);

/*
|--------------------------------------------------------------------------
| GET ALL DOCUMENTS
|--------------------------------------------------------------------------
| Permission: view
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticateToken,
  authorizePermission("view"),
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `SELECT
             d.id,
             d.file_name,
             d.file_type,
             d.file_size,
             d.case_id,
             d.uploaded_by,
             d.created_at,
             c.case_number,
             c.title AS case_title,
             u.name AS uploaded_by_name,
             u.email AS uploaded_by_email
           FROM documents d
           LEFT JOIN cases c
             ON d.case_id = c.id
           LEFT JOIN users u
             ON d.uploaded_by = u.id
           ORDER BY d.created_at DESC`
        );

      res.json({
        success: true,
        count: result.rows.length,
        documents: result.rows,
      });
    } catch (error) {
      console.error(
        "GET DOCUMENTS ERROR:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while fetching documents.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPLOAD DOCUMENT
|--------------------------------------------------------------------------
| Permission: upload
|--------------------------------------------------------------------------
*/

router.post(
  "/upload",
  authenticateToken,
  authorizePermission("upload"),
  handleUpload,
  async (req, res) => {
    let encryptedPath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "No document was uploaded.",
        });
      }

      /*
       * Validate original filename.
       */
      const originalFileName =
        sanitizeOriginalFilename(
          req.file.originalname
        );

      /*
       * Validate extension after sanitization.
       */
      const extension =
        getSafeExtension(
          originalFileName
        );

      if (
        !extension ||
        BLOCKED_EXTENSIONS.has(extension) ||
        !Object.prototype.hasOwnProperty.call(
          ALLOWED_FILE_TYPES,
          extension
        )
      ) {
        deleteFileSafely(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "This file type is not allowed.",
        });
      }

      /*
       * Validate case_id.
       */
      const caseIdNumber =
        Number(req.body.case_id);

      if (
        !Number.isInteger(caseIdNumber) ||
        caseIdNumber <= 0
      ) {
        deleteFileSafely(
          req.file.path
        );

        return res.status(400).json({
          success: false,
          message:
            "A valid case_id is required.",
        });
      }

      /*
       * Check case existence.
       */
      const caseResult =
        await pool.query(
          `SELECT
             id,
             case_number
           FROM cases
           WHERE id = $1`,
          [caseIdNumber]
        );

      if (
        caseResult.rows.length === 0
      ) {
        deleteFileSafely(
          req.file.path
        );

        return res.status(404).json({
          success: false,
          message: "Case not found.",
        });
      }

      /*
       * Generate random encrypted filename.
       */
      const encryptedFileName =
        `encrypted-${Date.now()}-` +
        `${crypto.randomBytes(24).toString("hex")}.enc`;

      encryptedPath = path.join(
        uploadDir,
        encryptedFileName
      );

      /*
       * Encrypt temporary plaintext file.
       */
      const encryptionInfo =
        await encryptFile(
          req.file.path,
          encryptedPath
        );

      /*
       * Store original plaintext size.
       */
      const originalSize =
        req.file.size;

      /*
       * Delete plaintext immediately.
       */
      deleteFileSafely(
        req.file.path
      );

      /*
       * Insert database record.
       */
      const result =
        await pool.query(
          `INSERT INTO documents
           (
             file_name,
             file_path,
             file_type,
             file_size,
             case_id,
             uploaded_by,
             encryption_iv,
             encryption_auth_tag
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING
             id,
             file_name,
             file_type,
             file_size,
             case_id,
             uploaded_by,
             created_at`,
          [
            originalFileName,
            encryptedPath,
            req.file.mimetype,
            originalSize,
            caseIdNumber,
            req.user.id,
            encryptionInfo.iv,
            encryptionInfo.authTag,
          ]
        );

      const document =
        result.rows[0];

      /*
       * Audit log.
       */
      try {
        await createAuditLog({
          userId: req.user.id,
          action:
            "DOCUMENT_UPLOADED",
          resourceType:
            "DOCUMENT",
          resourceId:
            document.id,
          details:
            `Document ${document.file_name} uploaded ` +
            `to case ${caseResult.rows[0].case_number}`,
        });
      } catch (auditError) {
        console.error(
          "UPLOAD AUDIT ERROR:",
          auditError.message
        );
      }

      res.status(201).json({
        success: true,
        message:
          "Document uploaded and encrypted successfully.",
        document,
      });
    } catch (error) {
      console.error(
        "DOCUMENT UPLOAD ERROR:",
        error.message
      );

      /*
       * Delete temporary plaintext.
       */
      deleteFileSafely(
        req.file?.path
      );

      /*
       * Delete encrypted file if database insert/encryption failed.
       */
      deleteFileSafely(
        encryptedPath
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while encrypting/uploading document.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DOWNLOAD DOCUMENT
|--------------------------------------------------------------------------
| Permission: download
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/download",
  authenticateToken,
  authorizePermission("download"),
  async (req, res) => {
    let tempDecryptedPath = null;

    try {
      /*
       * Validate document ID.
       */
      const documentId =
        Number(req.params.id);

      if (
        !Number.isInteger(documentId) ||
        documentId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid document ID.",
        });
      }

      /*
       * Generate unique temporary decrypted path.
       */
      tempDecryptedPath =
        path.join(
          tempDir,
          `download-${Date.now()}-` +
            `${crypto.randomBytes(16).toString("hex")}`
        );

      /*
       * Get document.
       */
      const result =
        await pool.query(
          `SELECT
             d.id,
             d.file_name,
             d.file_path,
             d.file_type,
             d.file_size,
             d.case_id,
             d.uploaded_by,
             d.encryption_iv,
             d.encryption_auth_tag,
             c.case_number
           FROM documents d
           LEFT JOIN cases c
             ON d.case_id = c.id
           WHERE d.id = $1`,
          [documentId]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Document not found.",
        });
      }

      const document =
        result.rows[0];

      /*
       * Encryption metadata must exist.
       */
      if (
        !document.encryption_iv ||
        !document.encryption_auth_tag
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Document encryption metadata is missing.",
        });
      }

      /*
       * Validate stored path.
       *
       * The database path must remain inside uploadDir.
       */
      const resolvedFilePath =
        path.resolve(
          document.file_path
        );

      const resolvedUploadDir =
        path.resolve(
          uploadDir
        ) + path.sep;

      if (
        !resolvedFilePath.startsWith(
          resolvedUploadDir
        )
      ) {
        console.error(
          "BLOCKED PATH TRAVERSAL ATTEMPT:",
          document.file_path
        );

        return res.status(403).json({
          success: false,
          message:
            "Invalid document storage path.",
        });
      }

      /*
       * Encrypted file must exist.
       */
      if (
        !fs.existsSync(
          resolvedFilePath
        )
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Encrypted file not found on server.",
        });
      }

      /*
       * Decrypt encrypted file.
       */
      await decryptFile(
        resolvedFilePath,
        tempDecryptedPath,
        document.encryption_iv,
        document.encryption_auth_tag
      );

      /*
       * Make sure decrypted file exists.
       */
      if (
        !fs.existsSync(
          tempDecryptedPath
        )
      ) {
        throw new Error(
          "Decrypted file was not created."
        );
      }

      /*
       * Download decrypted file.
       */
      res.download(
        tempDecryptedPath,
        sanitizeOriginalFilename(
          document.file_name
        ),
        async (downloadError) => {
          try {
            if (downloadError) {
              console.error(
                "DOWNLOAD ERROR:",
                downloadError.message
              );

              return;
            }

            /*
             * Audit successful download.
             */
            try {
              await createAuditLog({
                userId: req.user.id,
                action:
                  "DOCUMENT_DOWNLOADED",
                resourceType:
                  "DOCUMENT",
                resourceId:
                  document.id,
                details:
                  `Document ${document.file_name} downloaded ` +
                  `from case ${
                    document.case_number ||
                    document.case_id
                  }`,
              });
            } catch (auditError) {
              console.error(
                "DOWNLOAD AUDIT ERROR:",
                auditError.message
              );
            }
          } finally {
            /*
             * Always delete decrypted file.
             */
            deleteFileSafely(
              tempDecryptedPath
            );
          }
        }
      );
    } catch (error) {
      console.error(
        "DOCUMENT DOWNLOAD ERROR:",
        error.message
      );

      /*
       * Always cleanup decrypted plaintext.
       */
      deleteFileSafely(
        tempDecryptedPath
      );

      /*
       * Avoid sending another response if download has already started.
       */
      if (res.headersSent) {
        return;
      }

      /*
       * Authentication-tag / decryption failure.
       */
      if (
        error.message &&
        (
          error.message
            .toLowerCase()
            .includes("unable to authenticate") ||
          error.message
            .toLowerCase()
            .includes("authenticity") ||
          error.message
            .toLowerCase()
            .includes("bad decrypt")
        )
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Document integrity verification failed.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Server error while downloading document.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;