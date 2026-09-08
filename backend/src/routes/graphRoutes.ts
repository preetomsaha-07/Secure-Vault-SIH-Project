import { Router, Request, Response } from 'express';
import { getDb } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

export interface GraphNode {
  id: string;
  label: string;
  type: 'CASE' | 'DOCUMENT' | 'EVIDENCE' | 'PERSON' | 'VEHICLE' | 'LOCATION' | 'ORGANIZATION';
  sensitivity?: string;
  details?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: string;
}

// GET /api/graph/investigation/:caseId? - Interactive Relationship Graph
router.get('/investigation/:caseId?', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const requestedCaseId = req.params.caseId;
    const db = await getDb();

    // 1. Get Cases accessible to user
    let caseQuery = `SELECT * FROM cases WHERE deleted_at IS NULL`;
    const caseParams: any[] = [];

    if (requestedCaseId) {
      caseParams.push(requestedCaseId);
      caseQuery += ` AND id = $1`;
    } else if (user.role === 'INVESTIGATOR') {
      caseParams.push(user.id);
      caseQuery += ` AND (id IN (SELECT case_id FROM case_members WHERE user_id = $1) OR created_by = $1)`;
    }

    const cases = await db.query<any>(caseQuery, caseParams);
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const entityNodeSet = new Set<string>();

    for (const c of cases) {
      // Add Case node
      nodes.push({
        id: `case_${c.id}`,
        label: `${c.case_number}: ${c.title}`,
        type: 'CASE',
        sensitivity: c.sensitivity_level,
        details: {
          caseNumber: c.case_number,
          status: c.status,
          description: c.description,
          createdDate: c.created_at,
        },
      });

      // Fetch Documents for this case
      const docs = await db.query<any>(
        `SELECT id, title, sensitivity_level, ai_classification, ai_entities, original_filename
         FROM documents WHERE case_id = $1 AND status != 'DELETED'`,
        [c.id]
      );

      for (const doc of docs) {
        const docNodeId = `doc_${doc.id}`;
        nodes.push({
          id: docNodeId,
          label: doc.title,
          type: 'DOCUMENT',
          sensitivity: doc.sensitivity_level,
          details: {
            classification: doc.ai_classification,
            filename: doc.original_filename,
          },
        });

        edges.push({
          id: `edge_case_doc_${c.id}_${doc.id}`,
          source: `case_${c.id}`,
          target: docNodeId,
          label: 'CONTAINS_DOCUMENT',
        });

        // Add extracted entities from document
        if (doc.ai_entities) {
          try {
            const entities = JSON.parse(doc.ai_entities);
            for (const ent of entities) {
              const entNodeId = `ent_${ent.type}_${ent.value.replace(/[^a-zA-Z0-9]/g, '_')}`;

              if (!entityNodeSet.has(entNodeId)) {
                entityNodeSet.add(entNodeId);
                let nodeType: GraphNode['type'] = 'PERSON';
                if (ent.type === 'VEHICLE_NO') nodeType = 'VEHICLE';
                else if (ent.type === 'LOCATION') nodeType = 'LOCATION';
                else if (ent.type === 'LEGAL_SECTION') nodeType = 'ORGANIZATION';

                nodes.push({
                  id: entNodeId,
                  label: ent.value,
                  type: nodeType,
                  details: { entityType: ent.type, confidence: ent.confidence },
                });
              }

              edges.push({
                id: `edge_doc_ent_${doc.id}_${entNodeId}`,
                source: docNodeId,
                target: entNodeId,
                label: `MENTIONS_${ent.type}`,
              });
            }
          } catch {
            // Ignore parse errors on entity JSON
          }
        }
      }

      // Fetch Evidence for this case
      const evidenceItems = await db.query<any>(
        `SELECT id, evidence_number, title, status, storage_location FROM evidence WHERE case_id = $1`,
        [c.id]
      );

      for (const ev of evidenceItems) {
        const evNodeId = `ev_${ev.id}`;
        nodes.push({
          id: evNodeId,
          label: `${ev.evidence_number}: ${ev.title}`,
          type: 'EVIDENCE',
          details: {
            evidenceNumber: ev.evidence_number,
            status: ev.status,
            storageLocation: ev.storage_location,
          },
        });

        edges.push({
          id: `edge_case_ev_${c.id}_${ev.id}`,
          source: `case_${c.id}`,
          target: evNodeId,
          label: 'EVIDENCE_OF_CASE',
        });
      }
    }

    return res.status(200).json({
      caseId: requestedCaseId || null,
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        casesCount: cases.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Graph construction failed: ${err.message}` });
  }
});

export default router;
