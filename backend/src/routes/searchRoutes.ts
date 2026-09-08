import { Router, Request, Response } from 'express';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { searchLimiter } from '../config/rateLimiter.js';

const router = Router();

// GET /api/search - Smart Search (Metadata, Content, Natural Language)
router.get('/', authenticate, searchLimiter, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { q, caseId, departmentId, category, sensitivity } = req.query;
    const rawQuery = (q as string || '').trim();

    const db = await getDb();

    // 1. Natural Language Intent Parsing
    let inferredCase: string | null = null;
    let inferredClassification: string | null = null;
    let contentKeywords: string[] = [];

    if (rawQuery) {
      // Check for Case numbers like "104", "Case 104", "CASE-2026-104"
      const caseMatch = rawQuery.match(/(?:case\s*[-#]?\s*|case-2026-)(\d{3,4})/i);
      if (caseMatch) {
        inferredCase = caseMatch[1];
      }

      // Check for document category keywords
      const lowerQ = rawQuery.toLowerCase();
      if (lowerQ.includes('investigation report')) inferredClassification = 'Investigation Report';
      else if (lowerQ.includes('fir')) inferredClassification = 'FIR';
      else if (lowerQ.includes('forensic')) inferredClassification = 'Forensic Report';
      else if (lowerQ.includes('court order')) inferredClassification = 'Court Order';
      else if (lowerQ.includes('evidence')) inferredClassification = 'Evidence';

      // Split into keywords excluding stop words
      const stopWords = new Set(['find', 'all', 'the', 'in', 'related', 'to', 'reports', 'report', 'case', 'documents', 'document', 'and', 'or', 'of', 'for']);
      contentKeywords = rawQuery
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
    }

    // 2. Build SQL Query
    let sql = `
      SELECT d.id, d.title, d.original_filename, d.mime_type, d.file_size, d.sha256_hash,
             d.encryption_algo, d.case_id, d.department_id, d.owner_id, d.sensitivity_level,
             d.ai_classification, d.ai_confidence, d.ai_summary, d.ocr_extracted_text, d.ai_entities,
             d.created_at,
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

    if (caseId) {
      params.push(caseId);
      sql += ` AND d.case_id = $${params.length}`;
    } else if (inferredCase) {
      params.push(`%${inferredCase}%`);
      sql += ` AND (c.case_number LIKE $${params.length} OR c.title LIKE $${params.length})`;
    }

    if (departmentId) {
      params.push(departmentId);
      sql += ` AND d.department_id = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND d.ai_classification = $${params.length}`;
    } else if (inferredClassification) {
      params.push(inferredClassification);
      sql += ` AND d.ai_classification = $${params.length}`;
    }

    if (sensitivity) {
      params.push(sensitivity);
      sql += ` AND d.sensitivity_level = $${params.length}`;
    }

    // Keyword matching on title, ocr text, or entities
    if (contentKeywords.length > 0) {
      const keywordConditions = contentKeywords.map((kw) => {
        params.push(`%${kw}%`);
        const idx = params.length;
        return `(LOWER(d.title) LIKE $${idx} OR LOWER(d.original_filename) LIKE $${idx} OR LOWER(d.ocr_extracted_text) LIKE $${idx} OR LOWER(d.ai_entities) LIKE $${idx})`;
      });
      sql += ` AND (${keywordConditions.join(' OR ')})`;
    }

    sql += ` ORDER BY d.created_at DESC LIMIT 50`;

    const rawResults = await db.query<any>(sql, params);

    // 3. Strict Authorization Enforcement: Never leak documents user cannot access
    const authorizedResults = [];
    for (const doc of rawResults) {
      let isAuthorized = false;

      if (user.role === 'ADMINISTRATOR' || user.role === 'AUDITOR') {
        isAuthorized = true;
      } else if (doc.owner_id === user.id) {
        isAuthorized = true;
      } else if (doc.case_id) {
        const isMember = await db.get(
          `SELECT id FROM case_members WHERE case_id = $1 AND user_id = $2`,
          [doc.case_id, user.id]
        );
        if (isMember) isAuthorized = true;
      }

      if (!isAuthorized) {
        const hasPerm = await db.get(
          `SELECT id FROM document_permissions WHERE document_id = $1 AND user_id = $2 AND (expires_at IS NULL OR expires_at > datetime('now'))`,
          [doc.id, user.id]
        );
        if (hasPerm) isAuthorized = true;
      }

      if (isAuthorized) {
        // Mask full text, provide preview snippet
        const snippet = doc.ocr_extracted_text
          ? doc.ocr_extracted_text.slice(0, 180) + '...'
          : 'Content secured with AES-256-GCM.';

        authorizedResults.push({
          id: doc.id,
          title: doc.title,
          originalFilename: doc.original_filename,
          caseNumber: doc.case_number,
          caseTitle: doc.case_title,
          departmentName: doc.department_name,
          sensitivityLevel: doc.sensitivity_level,
          aiClassification: doc.ai_classification,
          aiConfidence: doc.ai_confidence,
          summary: doc.ai_summary,
          snippet,
          createdAt: doc.created_at,
        });
      }
    }

    return res.status(200).json({
      query: rawQuery,
      parsedIntent: {
        inferredCase,
        inferredClassification,
        keywords: contentKeywords,
      },
      results: authorizedResults,
      totalCount: authorizedResults.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Search failed: ${err.message}` });
  }
});

export default router;
