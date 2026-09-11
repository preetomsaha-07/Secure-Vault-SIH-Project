import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeDocumentAccess } from '../middleware/authorize.js';
import { upload, validateMagicBytes } from '../middleware/upload.js';
import { uploadLimiter } from '../config/rateLimiter.js';
import { CryptoHasher } from '../crypto/hasher.js';
import { Aes256GcmCipher } from '../crypto/cipher.js';
import { defaultKeyManager } from '../crypto/keyManagement.js';
import { getStorageProvider } from '../storage/storageProvider.js';
import { OcrEngine } from '../ai/ocr.js';
import { DocumentClassifier } from '../ai/classifier.js';
import { SensitiveInfoDetector } from '../ai/sensitiveDetector.js';
import { DocumentSummarizer } from '../ai/summarizer.js';
import { WatermarkService } from '../services/watermark.js';
import { AuditService } from '../services/auditService.js';
import { DigitalSignatureEngine } from '../crypto/signatures.js';
import { RiskMonitoringEngine } from '../services/risk.js';

const router = Router();

// POST /api/docs/upload - Complete Secure Upload Pipeline
router.post(
  '/upload',
  authenticate,
  uploadLimiter,
  upload.single('file'),
  validateMagicBytes,
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const file = req.file!;
      const { caseId, departmentId, sensitivityLevel, title } = req.body;

      const db = await getDb();
      const storage = getStorageProvider();

      const docId = uuidv4();
      const docTitle = title || file.originalname;
      const targetDeptId = departmentId || user.departmentId;
      const targetSensitivity = sensitivityLevel || 'CONFIDENTIAL';

      // 1. Calculate SHA-256 hash of original plaintext
      const sha256Hash = CryptoHasher.sha256(file.buffer);

      // 2. Duplicate Detection
      const existingDoc = await db.get<any>(
        `SELECT id, title, case_id, current_version, created_at FROM documents WHERE sha256_hash = $1 AND status != 'DELETED'`,
        [sha256Hash]
      );

      if (existingDoc && req.body.forceDuplicate !== 'true') {
        return res.status(409).json({
          duplicateDetected: true,
          message: 'DUPLICATE DOCUMENT DETECTED: A document with identical cryptographic SHA-256 fingerprint already exists in SecureVault.',
          existingDocument: {
            id: existingDoc.id,
            title: existingDoc.title,
            caseId: existingDoc.case_id,
            version: existingDoc.current_version,
            createdAt: existingDoc.created_at,
            sha256Hash,
          },
        });
      }

      // 3. Envelope Encryption using AES-256-GCM
      const docKey = defaultKeyManager.getDocumentKey(docId);
      const encryptedPayload = Aes256GcmCipher.encrypt(file.buffer, docKey);

      // 4. Save encrypted ciphertext to private object storage
      const storageKey = `vault_objects/${docId}_enc.bin`;
      await storage.saveObject(storageKey, encryptedPayload.combined);

      // 5. Run OCR & AI Pipeline
      const extractedText = await OcrEngine.processDocument(file.buffer, file.mimetype, file.originalname);
      const classification = DocumentClassifier.classify(extractedText, file.originalname);
      const sensitiveEntities = SensitiveInfoDetector.detectEntities(extractedText);
      const initialSummary = DocumentSummarizer.summarize(extractedText, file.originalname, caseId);

      // 6. Insert metadata into database
      await db.run(
        `INSERT INTO documents (
          id, title, original_filename, mime_type, file_size, storage_path,
          sha256_hash, encryption_algo, encryption_key_id, case_id, department_id,
          owner_id, sensitivity_level, current_version, status,
          ai_classification, ai_confidence, ai_summary, ai_entities, ocr_extracted_text,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, 'ACTIVE', $14, $15, $16, $17, $18, datetime('now'), datetime('now'))`,
        [
          docId,
          docTitle,
          file.originalname,
          file.mimetype,
          file.size,
          storageKey,
          sha256Hash,
          'aes-256-gcm',
          `key_hkdf_${docId.slice(0, 8)}`,
          caseId || null,
          targetDeptId,
          user.id,
          targetSensitivity,
          classification.classification,
          classification.confidence,
          initialSummary.executiveSummary,
          JSON.stringify(sensitiveEntities),
          extractedText.slice(0, 5000), // Index first 5k characters
        ]
      );

      // 7. Insert initial Version 1
      await db.run(
        `INSERT INTO document_versions (id, document_id, version_number, storage_path, sha256_hash, file_size, created_by, change_summary, created_at)
         VALUES ($1, $2, 1, $3, $4, $5, $6, 'Initial cryptographic upload', datetime('now'))`,
        [uuidv4(), docId, storageKey, sha256Hash, file.size, user.id]
      );

      // 8. Associate AI Suggested Tags
      for (const tagName of classification.suggestedTags) {
        const tagId = uuidv4();
        await db.run(
          `INSERT INTO tags (id, name, created_at) VALUES ($1, $2, datetime('now')) ON CONFLICT(name) DO NOTHING`,
          [tagId, tagName]
        );
        const tag = await db.get<any>(`SELECT id FROM tags WHERE name = $1`, [tagName]);
        if (tag) {
          await db.run(
            `INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [docId, tag.id]
          );
        }
      }

      // 9. Append to Tamper-Evident Audit Trail
      await AuditService.logEvent(db, {
        userId: user.id,
        userName: user.fullName,
        action: 'DOCUMENT_UPLOAD_ENCRYPTED',
        resourceId: docId,
        resourceType: 'DOCUMENT',
        caseId: caseId || undefined,
        details: {
          filename: file.originalname,
          sha256: sha256Hash,
          encryption: 'AES-256-GCM',
          sizeBytes: file.size,
          aiClassification: classification.classification,
          confidence: classification.confidence,
        },
        ipAddress: req.ip,
      });

      return res.status(201).json({
        message: 'Document successfully secured, encrypted with AES-256-GCM, and indexed.',
        document: {
          id: docId,
          title: docTitle,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          sha256Hash,
          encryptionAlgorithm: 'AES-256-GCM',
          storageKey,
          caseId,
          departmentId: targetDeptId,
          sensitivityLevel: targetSensitivity,
          aiClassification: classification.classification,
          aiConfidence: classification.confidence,
          suggestedTags: classification.suggestedTags,
          detectedEntitiesCount: sensitiveEntities.length,
          summary: initialSummary.executiveSummary,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[UPLOAD ERROR]', err);
      return res.status(500).json({ error: `Upload pipeline failed: ${err.message}` });
    }
  }
);

// GET /api/docs - List authorized documents
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { caseId, departmentId, sensitivity, search } = req.query;
    const db = await getDb();

    let query = `
      SELECT d.id, d.title, d.original_filename, d.mime_type, d.file_size, d.sha256_hash,
             d.encryption_algo, d.case_id, d.department_id, d.owner_id, d.sensitivity_level,
             d.current_version, d.status, d.ai_classification, d.ai_confidence, d.is_tampered_demo,
             d.created_at, d.updated_at,
             c.case_number, c.title as case_title,
             dept.name as department_name,
             u.full_name as owner_name
      FROM documents d
      LEFT JOIN cases c ON d.case_id = c.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      LEFT JOIN users u ON d.owner_id = u.id
      WHERE d.status != 'DELETED'
    `;

    const params: any[] = [];

    // Filter by Case if requested
    if (caseId) {
      params.push(caseId);
      query += ` AND d.case_id = $${params.length}`;
    }

    // Filter by Department if requested
    if (departmentId) {
      params.push(departmentId);
      query += ` AND d.department_id = $${params.length}`;
    }

    // Filter by Sensitivity
    if (sensitivity) {
      params.push(sensitivity);
      query += ` AND d.sensitivity_level = $${params.length}`;
    }

    query += ` ORDER BY d.created_at DESC`;

    const docs = await db.query<any>(query, params);

    // Apply strict multi-layered ABAC filtering in memory
    const authorizedDocs = [];
    for (const doc of docs) {
      if (user.role === 'ADMINISTRATOR' || user.role === 'AUDITOR') {
        authorizedDocs.push(doc);
        continue;
      }

      // Investigator: must be owner OR assigned to case OR have explicit permission
      if (doc.owner_id === user.id) {
        authorizedDocs.push(doc);
        continue;
      }

      if (doc.case_id) {
        const isMember = await db.get(
          `SELECT id FROM case_members WHERE case_id = $1 AND user_id = $2`,
          [doc.case_id, user.id]
        );
        if (isMember) {
          authorizedDocs.push(doc);
          continue;
        }
      }

      // Check explicit permission
      const perm = await db.get(
        `SELECT id FROM document_permissions WHERE document_id = $1 AND user_id = $2 AND (expires_at IS NULL OR expires_at > datetime('now'))`,
        [doc.id, user.id]
      );
      if (perm) {
        authorizedDocs.push(doc);
      }
    }

    return res.status(200).json({
      documents: authorizedDocs,
      total: authorizedDocs.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
});

// GET /api/docs/:id - Document Details
router.get('/:id', authenticate, authorizeDocumentAccess('READ'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const db = await getDb();

    const doc = await db.get<any>(
      `SELECT d.*, c.case_number, c.title as case_title, dept.name as department_name, u.full_name as owner_name, u.email as owner_email
       FROM documents d
       LEFT JOIN cases c ON d.case_id = c.id
       LEFT JOIN departments dept ON d.department_id = dept.id
       LEFT JOIN users u ON d.owner_id = u.id
       WHERE d.id = $1`,
      [docId]
    );

    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    // Fetch tags
    const tags = await db.query(
      `SELECT t.name FROM tags t JOIN document_tags dt ON t.id = dt.tag_id WHERE dt.document_id = $1`,
      [docId]
    );

    // Fetch signature if signed
    const signature = await db.get(
      `SELECT * FROM digital_signatures WHERE document_id = $1 ORDER BY signed_at DESC LIMIT 1`,
      [docId]
    );

    // Fetch latest integrity verification
    const latestIntegrity = await db.get(
      `SELECT * FROM document_integrity WHERE document_id = $1 ORDER BY verified_at DESC LIMIT 1`,
      [docId]
    );

    return res.status(200).json({
      document: {
        ...doc,
        tags: tags.map((t) => t.name),
        aiEntities: doc.ai_entities ? JSON.parse(doc.ai_entities) : [],
        digitalSignature: signature || null,
        latestIntegrityCheck: latestIntegrity || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load document details.' });
  }
});

// GET /api/docs/:id/preview - Dynamic Watermarked Preview
router.get('/:id/preview', authenticate, authorizeDocumentAccess('READ'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;
    const db = await getDb();
    const storage = getStorageProvider();

    const doc = await db.get<any>(`SELECT * FROM documents WHERE id = $1`, [docId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    // Fetch encrypted ciphertext from storage
    const encryptedBytes = await storage.getObject(doc.storage_path);

    // Decrypt using AES-256-GCM
    const docKey = defaultKeyManager.getDocumentKey(doc.id);
    const decryptedPlaintext = Aes256GcmCipher.decrypt(encryptedBytes, docKey);

    // Apply dynamic non-destructive watermark
    let previewBuffer = decryptedPlaintext;
    if (doc.mime_type === 'application/pdf') {
      previewBuffer = await WatermarkService.applyPdfWatermark(decryptedPlaintext, {
        userId: user.id,
        userName: user.fullName,
        documentId: doc.id,
        classification: doc.sensitivity_level,
      });
    }

    // Log preview event in audit trail
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'DOCUMENT_WATERMARKED_PREVIEW',
      resourceId: doc.id,
      resourceType: 'DOCUMENT',
      caseId: doc.case_id,
      details: `Watermarked preview rendered for ${user.fullName} (${user.role})`,
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="PREVIEW_${doc.original_filename}"`);
    res.setHeader('X-Encrypted-Algorithm', 'AES-256-GCM');
    res.setHeader('X-Integrity-SHA256', doc.sha256_hash);
    return res.send(previewBuffer);
  } catch (err: any) {
    console.error('[PREVIEW ERROR]', err);
    return res.status(500).json({ error: `Preview failed: ${err.message}` });
  }
});

// GET /api/docs/:id/download - Secure Download with Dynamic Watermark
router.get('/:id/download', authenticate, authorizeDocumentAccess('DOWNLOAD'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;
    const db = await getDb();
    const storage = getStorageProvider();

    const doc = await db.get<any>(`SELECT * FROM documents WHERE id = $1`, [docId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    // Fetch and Decrypt
    const encryptedBytes = await storage.getObject(doc.storage_path);
    const docKey = defaultKeyManager.getDocumentKey(doc.id);
    const decryptedPlaintext = Aes256GcmCipher.decrypt(encryptedBytes, docKey);

    // Apply watermark
    let finalBuffer = decryptedPlaintext;
    if (doc.mime_type === 'application/pdf') {
      finalBuffer = await WatermarkService.applyPdfWatermark(decryptedPlaintext, {
        userId: user.id,
        userName: user.fullName,
        documentId: doc.id,
      });
    }

    // Audit download
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'DOCUMENT_DOWNLOAD',
      resourceId: doc.id,
      resourceType: 'DOCUMENT',
      caseId: doc.case_id,
      details: {
        filename: doc.original_filename,
        sha256: doc.sha256_hash,
        sizeBytes: doc.file_size,
      },
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_filename}"`);
    res.setHeader('X-Integrity-SHA256', doc.sha256_hash);
    return res.send(finalBuffer);
  } catch (err: any) {
    return res.status(500).json({ error: `Download failed: ${err.message}` });
  }
});

// POST /api/docs/:id/verify-integrity - SHA-256 & GCM Integrity Verification
router.post('/:id/verify-integrity', authenticate, authorizeDocumentAccess('READ'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;
    const db = await getDb();
    const storage = getStorageProvider();

    const doc = await db.get<any>(`SELECT * FROM documents WHERE id = $1`, [docId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    const registeredHash = doc.sha256_hash;
    let currentHash = '';
    let isMatch = false;
    let failureReason = '';

    try {
      // If marked as tampered demo or actual file modified
      if (doc.is_tampered_demo === 1) {
        currentHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855_TAMPERED_DEMO';
        isMatch = false;
        failureReason = 'Tamper simulation flag active on demo copy.';
      } else {
        const encryptedBytes = await storage.getObject(doc.storage_path);
        const docKey = defaultKeyManager.getDocumentKey(doc.id);
        const plaintext = Aes256GcmCipher.decrypt(encryptedBytes, docKey);
        currentHash = CryptoHasher.sha256(plaintext);
        isMatch = currentHash.toLowerCase() === registeredHash.toLowerCase();
      }
    } catch (decryptErr: any) {
      isMatch = false;
      failureReason = `Cryptographic decryption / GCM auth tag failure: ${decryptErr.message}`;
      currentHash = '00000000_CORRUPT_CIPHERTEXT_TAG_MISMATCH';
    }

    const status = isMatch ? 'VERIFIED' : 'COMPROMISED';
    const timestamp = new Date().toISOString();

    // Store in document_integrity table
    await db.run(
      `INSERT INTO document_integrity (id, document_id, registered_hash, verified_hash, status, verified_by, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, datetime('now'))`,
      [uuidv4(), doc.id, registeredHash, currentHash, status, user.id]
    );

    // Audit log
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: isMatch ? 'DOCUMENT_INTEGRITY_VERIFIED' : 'DOCUMENT_INTEGRITY_FAILED',
      resourceId: doc.id,
      resourceType: 'DOCUMENT',
      caseId: doc.case_id,
      details: {
        registeredHash,
        currentHash,
        status,
        reason: failureReason || (isMatch ? 'SHA-256 fingerprint verified exactly' : 'Hash mismatch detected'),
      },
      ipAddress: req.ip,
    });

    if (!isMatch) {
      // Trigger critical security alert
      await RiskMonitoringEngine.recordSecurityEvent(db, {
        eventType: 'TAMPERING_DETECTED',
        userId: user.id,
        resourceId: doc.id,
        caseId: doc.case_id,
        description: `INTEGRITY COMPROMISED: Document ${doc.title} (${doc.id}) failed cryptographic verification!`,
        additionalReason: `Registered hash ${registeredHash} does not match evaluated hash ${currentHash}.`,
      });
    }

    return res.status(200).json({
      status,
      verified: isMatch,
      registeredHash,
      currentHash,
      verifiedAt: timestamp,
      verifiedBy: user.fullName,
      message: isMatch
        ? '✅ INTEGRITY VERIFIED: Original registered SHA-256 fingerprint matches stored ciphertext exactly.'
        : '🚨 DOCUMENT INTEGRITY COMPROMISED: Fingerprint mismatch or corrupt authentication tag detected!',
      failureReason: failureReason || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Verification failed: ${err.message}` });
  }
});

// POST /api/docs/:id/tamper-demo - Controlled Tampering Demonstration on Demo Copy
router.post('/:id/tamper-demo', authenticate, authorizeDocumentAccess('WRITE'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const db = await getDb();

    // Mark document with tamper demo flag
    await db.run(`UPDATE documents SET is_tampered_demo = 1, updated_at = datetime('now') WHERE id = $1`, [docId]);

    await AuditService.logEvent(db, {
      userId: req.user!.id,
      userName: req.user!.fullName,
      action: 'DEMO_TAMPER_SIMULATION_APPLIED',
      resourceId: docId,
      resourceType: 'DOCUMENT',
      details: 'Controlled demonstration tampering applied to document copy for hackathon integrity testing.',
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: 'Controlled demo tampering applied to document copy. Verify Document Integrity to observe detection.',
      isTamperedDemo: true,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Tamper simulation failed.' });
  }
});

// POST /api/docs/:id/reset-tamper - Reset Tamper Demo
router.post('/:id/reset-tamper', authenticate, authorizeDocumentAccess('WRITE'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const db = await getDb();

    await db.run(`UPDATE documents SET is_tampered_demo = 0, updated_at = datetime('now') WHERE id = $1`, [docId]);

    return res.status(200).json({
      message: 'Tamper simulation reset. Document restored to pristine verified state.',
      isTamperedDemo: false,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Reset failed.' });
  }
});

// POST /api/docs/:id/sign - Digital Signature Creation
router.post('/:id/sign', authenticate, authorizeDocumentAccess('WRITE'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;
    const db = await getDb();

    const doc = await db.get<any>(`SELECT * FROM documents WHERE id = $1`, [docId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    // Generate asymmetric digital signature on document SHA-256 hash
    const signatureMeta = DigitalSignatureEngine.signHash(doc.sha256_hash, user.id, user.fullName);

    // Save into digital_signatures
    const sigId = uuidv4();
    await db.run(
      `INSERT INTO digital_signatures (id, document_id, signer_id, signer_name, signed_hash, signature_hex, key_fingerprint, algorithm, certificate_authority, signed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        sigId,
        doc.id,
        user.id,
        user.fullName,
        doc.sha256_hash,
        signatureMeta.signatureHex,
        signatureMeta.keyFingerprint,
        signatureMeta.algorithm,
        signatureMeta.certificateAuthority,
        signatureMeta.signedAt,
      ]
    );

    // Audit signature event
    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'DOCUMENT_DIGITALLY_SIGNED',
      resourceId: doc.id,
      resourceType: 'DOCUMENT',
      caseId: doc.case_id,
      details: {
        algorithm: signatureMeta.algorithm,
        keyFingerprint: signatureMeta.keyFingerprint,
        signer: user.fullName,
      },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: '✅ Document digitally signed successfully with asymmetric RSA-PSS private key.',
      signature: {
        id: sigId,
        ...signatureMeta,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Signing failed: ${err.message}` });
  }
});

// GET /api/docs/:id/signature - Signature Verification
router.get('/:id/signature', authenticate, authorizeDocumentAccess('READ'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const db = await getDb();

    const doc = await db.get<any>(`SELECT sha256_hash, is_tampered_demo FROM documents WHERE id = $1`, [docId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    const sig = await db.get<any>(
      `SELECT * FROM digital_signatures WHERE document_id = $1 ORDER BY signed_at DESC LIMIT 1`,
      [docId]
    );

    if (!sig) {
      return res.status(200).json({ hasSignature: false, message: 'Document is not digitally signed yet.' });
    }

    // Determine current hash (if tampered demo copy, hash differs)
    const currentHash = doc.is_tampered_demo ? 'tampered_hash_modified_demo' : doc.sha256_hash;

    const verification = DigitalSignatureEngine.verifySignature(
      currentHash,
      sig.signature_hex,
      sig.signed_hash
    );

    return res.status(200).json({
      hasSignature: true,
      signature: sig,
      verification,
      statusBadge:
        verification.status === 'VALID'
          ? '✅ SIGNATURE VALID'
          : verification.status === 'DOCUMENT_MODIFIED_AFTER_SIGNING'
          ? '⚠️ DOCUMENT MODIFIED AFTER SIGNING'
          : '❌ SIGNATURE INVALID',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Signature verification failed.' });
  }
});

// POST /api/docs/:id/summarize - On-demand AI Summarization
router.post('/:id/summarize', authenticate, authorizeDocumentAccess('READ'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const db = await getDb();

    const doc = await db.get<any>(`SELECT * FROM documents WHERE id = $1`, [docId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    const textToSummarize = doc.ocr_extracted_text || `${doc.title} ${doc.original_filename}`;
    const summary = DocumentSummarizer.summarize(textToSummarize, doc.original_filename, doc.case_id);

    // Save back to document record
    await db.run(
      `UPDATE documents SET ai_summary = $1, ai_entities = $2, updated_at = datetime('now') WHERE id = $3`,
      [summary.executiveSummary, JSON.stringify(summary.keyEntities), docId]
    );

    return res.status(200).json({
      summary,
      message: 'Executive summary and forensic entities generated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Summarization failed.' });
  }
});

// PUT /api/docs/:id/ai - Update AI classification / tags (Authorized Edit)
router.put('/:id/ai', authenticate, authorizeDocumentAccess('WRITE'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const { classification, tags, summary } = req.body;
    const db = await getDb();

    if (classification || summary) {
      await db.run(
        `UPDATE documents SET ai_classification = COALESCE($1, ai_classification), ai_summary = COALESCE($2, ai_summary), updated_at = datetime('now') WHERE id = $3`,
        [classification, summary, docId]
      );
    }

    if (Array.isArray(tags)) {
      // Clear old tags and re-insert
      await db.run(`DELETE FROM document_tags WHERE document_id = $1`, [docId]);
      for (const tagName of tags) {
        const tagId = uuidv4();
        await db.run(
          `INSERT INTO tags (id, name, created_at) VALUES ($1, $2, datetime('now')) ON CONFLICT(name) DO NOTHING`,
          [tagId, tagName]
        );
        const tag = await db.get<any>(`SELECT id FROM tags WHERE name = $1`, [tagName]);
        if (tag) {
          await db.run(
            `INSERT INTO document_tags (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [docId, tag.id]
          );
        }
      }
    }

    return res.status(200).json({ message: 'Document classification and metadata updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update AI classification.' });
  }
});

// GET /api/docs/:id/versions - Retrieve version history
router.get('/:id/versions', authenticate, authorizeDocumentAccess('READ'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const db = await getDb();

    const versions = await db.query(
      `SELECT v.*, u.full_name as created_by_name, u.badge_number
       FROM document_versions v
       LEFT JOIN users u ON v.created_by = u.id
       WHERE v.document_id = $1
       ORDER BY v.version_number ASC`,
      [docId]
    );

    const doc = await db.get<any>(`SELECT current_version, sha256_hash, owner_id, created_at FROM documents WHERE id = $1`, [docId]);

    const formatted = versions.map((v: any) => ({
      id: v.id,
      document_id: v.document_id,
      version_number: `v1.${v.version_number - 1}`,
      sha256_hash: v.sha256_hash,
      created_by_id: v.created_by,
      created_by_name: v.created_by_name || 'Authorized Officer',
      created_at: v.created_at,
      change_summary: v.change_summary || 'Incremental case amendment',
      previous_version_ref: v.version_number > 1 ? `v1.${v.version_number - 2}` : null,
      is_current: v.version_number === doc?.current_version,
    }));

    return res.status(200).json({ versions: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch document versions.' });
  }
});

// POST /api/docs/:id/versions - Create new version revision
router.post('/:id/versions', authenticate, authorizeDocumentAccess('WRITE'), async (req: Request, res: Response) => {
  try {
    const docId = req.params.id;
    const user = req.user!;
    const { change_summary } = req.body;
    const db = await getDb();

    const doc = await db.get<any>(`SELECT * FROM documents WHERE id = $1`, [docId]);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    const newVersionNum = (doc.current_version || 1) + 1;
    const newHash = CryptoHasher.sha256(`${doc.sha256_hash}:${newVersionNum}:${Date.now()}`);
    const verId = uuidv4();

    await db.run(
      `INSERT INTO document_versions (id, document_id, version_number, storage_path, sha256_hash, file_size, created_by, change_summary, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, datetime('now'))`,
      [verId, docId, newVersionNum, doc.storage_path, newHash, doc.file_size, user.id, change_summary || 'Revision addendum filed']
    );

    await db.run(
      `UPDATE documents SET current_version = $1, sha256_hash = $2, updated_at = datetime('now') WHERE id = $3`,
      [newVersionNum, newHash, docId]
    );

    await AuditService.logEvent(db, {
      userId: user.id,
      userName: user.fullName,
      action: 'DOCUMENT_VERSION_CREATED',
      resourceId: docId,
      resourceType: 'DOCUMENT',
      caseId: doc.case_id,
      details: { version: `v1.${newVersionNum - 1}`, change_summary, newHash },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      message: 'New document revision successfully committed.',
      version: {
        id: verId,
        document_id: docId,
        version_number: `v1.${newVersionNum - 1}`,
        sha256_hash: newHash,
        created_by_name: user.fullName,
        change_summary,
        is_current: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create revision.' });
  }
});

export default router;
