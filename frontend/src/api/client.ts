import {
  MOCK_USERS,
  MOCK_DEPARTMENTS,
  MOCK_CASES,
  MOCK_CASE_MEMBERS,
  MOCK_DOCUMENTS,
  MOCK_EVIDENCE,
  MOCK_CUSTODY_EVENTS,
  MOCK_AUDIT_LOGS,
  MOCK_SECURITY_ALERTS,
  MOCK_GRAPH_DATA,
} from './mockData';
import { User, DocumentRecord, EvidenceRecord, CustodyEvent, AuditRecord, SecurityAlert } from '../types';

const BASE_URL = ((import.meta as any).env?.VITE_API_URL || '') + '/api';

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// In-memory state for offline/demo mock session
let docsState: DocumentRecord[] = [...MOCK_DOCUMENTS];
let evidenceState: EvidenceRecord[] = [...MOCK_EVIDENCE];
let custodyEventsState: Record<string, CustodyEvent[]> = { ...MOCK_CUSTODY_EVENTS };
let auditLogsState: AuditRecord[] = [...MOCK_AUDIT_LOGS];
let alertsState: SecurityAlert[] = [...MOCK_SECURITY_ALERTS];
let isAuditTampered = false;

let usersState: User[] = [...Object.values(MOCK_USERS)];
let credentialsState: Record<string, string> = {
  'admin@securevault.local': 'Password123!',
  'inv.a@securevault.local': 'Password123!',
  'inv.b@securevault.local': 'Password123!',
  'auditor@securevault.local': 'Password123!',
};

// Mock dispatcher when real backend is offline or on Vercel
function handleMockRequest<T>(endpoint: string, method: string, body?: any): T {
  let parsedBody = body;
  if (typeof body === 'string') {
    try {
      parsedBody = JSON.parse(body);
    } catch {}
  }

  const token = sessionStorage.getItem('securevault_token');
  const activePersonaKey = sessionStorage.getItem('securevault_active_persona') || 'admin';
  const currentUser: User = MOCK_USERS[activePersonaKey] || usersState[0] || MOCK_USERS['admin'];

  const cleanEndpoint = endpoint.split('?')[0];

  // 1. AUTH
  if (cleanEndpoint === '/auth/me') {
    const isLoggedIn = sessionStorage.getItem('securevault_logged_in') === 'true' || !!token;
    if (!isLoggedIn) {
      return { user: null } as unknown as T;
    }
    return { user: currentUser } as unknown as T;
  }

  if (cleanEndpoint === '/auth/login' && method === 'POST') {
    const email = (parsedBody?.email || '').toLowerCase().trim();
    
    // Check in usersState first!
    const foundUser = usersState.find((u) => u.email.toLowerCase() === email);
    let matchedUser = foundUser;

    if (!matchedUser) {
      if (email.includes('inv.a')) matchedUser = MOCK_USERS['inv_a'];
      else if (email.includes('inv.b')) matchedUser = MOCK_USERS['inv_b'];
      else if (email.includes('auditor')) matchedUser = MOCK_USERS['auditor'];
      else if (email.includes('admin')) matchedUser = MOCK_USERS['admin'];
      else {
        // Create an ad-hoc demo user for this email!
        matchedUser = {
          id: 'user_' + Date.now(),
          email,
          fullName: email.split('@')[0].toUpperCase(),
          badgeNumber: `SV-OFF-${Math.floor(100 + Math.random() * 900)}`,
          role: 'INVESTIGATOR',
          departmentId: 'dept_inv',
          departmentName: 'Investigation Division',
          departmentCode: 'INV',
          mfaEnabled: true,
        };
        usersState.push(matchedUser);
      }
    }

    sessionStorage.setItem('securevault_token', 'demo-token-' + Date.now());
    sessionStorage.setItem('securevault_logged_in', 'true');
    return { token: 'demo-token-' + Date.now(), user: matchedUser } as unknown as T;
  }

  if (cleanEndpoint === '/auth/register' && method === 'POST') {
    const fullName = parsedBody?.fullName || parsedBody?.name || 'Authorized Officer';
    const email = (parsedBody?.email || '').toLowerCase().trim();
    const deptId = parsedBody?.departmentId || 'dept_inv';
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === deptId) || MOCK_DEPARTMENTS[1];
    const role = parsedBody?.role || 'INVESTIGATOR';
    const badge = parsedBody?.badgeNumber || `SV-INV-${Math.floor(100 + Math.random() * 900)}`;
    const pass = parsedBody?.password || 'Password123!';

    const newUser: User = {
      id: 'user_' + Date.now(),
      email,
      fullName,
      badgeNumber: badge,
      role: role as any,
      departmentId: dept.id,
      departmentName: dept.name,
      departmentCode: dept.code,
      mfaEnabled: true,
    };

    usersState.push(newUser);
    credentialsState[email] = pass;

    auditLogsState.unshift({
      id: 'audit_' + Date.now(),
      user_id: newUser.id,
      user_name: newUser.fullName,
      action: 'USER_REGISTERED',
      details: `Officer ${fullName} self-registered with Badge ${badge} into ${dept.name}.`,
      ip_address: '10.0.4.12',
      timestamp: new Date().toISOString(),
      previous_hash: auditLogsState[0]?.current_hash || '0000000000000000000000000000000000000000000000000000000000000000',
      current_hash: 'c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9',
    });

    sessionStorage.setItem('securevault_token', 'demo-token-' + Date.now());
    sessionStorage.setItem('securevault_logged_in', 'true');

    return { token: 'demo-token-' + Date.now(), user: newUser, message: 'Registration successful.' } as unknown as T;
  }

  if (cleanEndpoint === '/auth/logout') {
    sessionStorage.removeItem('securevault_token');
    sessionStorage.removeItem('securevault_logged_in');
    return { success: true } as unknown as T;
  }

  // 2. SYSTEM STATS & METRICS
  if (cleanEndpoint === '/system/stats') {
    return {
      stats: {
        totalDocuments: docsState.length,
        totalCases: MOCK_CASES.length,
        totalEvidence: evidenceState.length,
        verifiedDocuments: docsState.filter((d) => d.is_tampered_demo === 0).length,
        signedDocuments: docsState.filter((d) => d.digitalSignature).length,
        activeSecurityAlerts: alertsState.filter((a) => !a.is_resolved).length,
        storageBytesUsed: docsState.reduce((acc, d) => acc + (d.file_size || 0), 0),
      },
    } as unknown as T;
  }

  if (cleanEndpoint === '/system/departments') {
    return { departments: MOCK_DEPARTMENTS } as unknown as T;
  }

  if (cleanEndpoint === '/system/users') {
    if (method === 'POST') {
      const fullName = parsedBody?.fullName || 'New Officer';
      const email = (parsedBody?.email || '').toLowerCase().trim();
      const deptId = parsedBody?.departmentId || 'dept_inv';
      const dept = MOCK_DEPARTMENTS.find((d) => d.id === deptId) || MOCK_DEPARTMENTS[1];
      const role = parsedBody?.role || 'INVESTIGATOR';
      const badge = parsedBody?.badgeNumber || `SV-INV-${Math.floor(100 + Math.random() * 900)}`;
      const pass = parsedBody?.password || 'Password123!';

      const newUser: User = {
        id: 'user_' + Date.now(),
        email,
        fullName,
        badgeNumber: badge,
        role: role as any,
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        mfaEnabled: true,
      };

      usersState.push(newUser);
      credentialsState[email] = pass;

      auditLogsState.unshift({
        id: 'audit_' + Date.now(),
        user_id: currentUser.id,
        user_name: currentUser.fullName,
        action: 'USER_PROVISIONED',
        details: `Chief Arthur Pendelton provisioned credentials for Officer ${fullName} (Badge ${badge}) with Clearance ${role}.`,
        ip_address: '10.0.4.12',
        timestamp: new Date().toISOString(),
        previous_hash: auditLogsState[0]?.current_hash || '0000000000000000000000000000000000000000000000000000000000000000',
        current_hash: '8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
      });

      return { user: newUser, message: 'Officer successfully provisioned.' } as unknown as T;
    }
    return { users: usersState } as unknown as T;
  }

  if (cleanEndpoint === '/system/notifications') {
    return {
      notifications: [
        {
          id: 'notif_1',
          title: 'Case 104 Integrity Verified',
          message: 'Automated cryptographic health check passed. SHA-256 chains intact.',
          is_read: false,
          created_at: '2026-08-25T10:00:00Z',
        },
        {
          id: 'notif_2',
          title: 'Security Alert: Probing Detected',
          message: 'Access denied recorded for Detective Marcus Vance on restricted case.',
          is_read: false,
          created_at: '2026-08-15T14:25:00Z',
        },
      ],
    } as unknown as T;
  }

  if (cleanEndpoint === '/security/metrics') {
    const criticals = alertsState.filter((a) => a.severity === 'CRITICAL' && !a.is_resolved).length;
    const highs = alertsState.filter((a) => a.severity === 'HIGH' && !a.is_resolved).length;
    const level = criticals > 0 ? 'CRITICAL' : highs > 0 ? 'HIGH' : 'LOW';
    const score = criticals > 0 ? 85 : highs > 0 ? 60 : 20;
    return {
      riskPosture: {
        overallLevel: level,
        overallScore: score,
      },
    } as unknown as T;
  }

  if (cleanEndpoint === '/security/alerts') {
    return { alerts: alertsState } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/security/alerts/') && cleanEndpoint.endsWith('/resolve')) {
    const alertId = cleanEndpoint.split('/')[3];
    alertsState = alertsState.map((a) => (a.id === alertId ? { ...a, is_resolved: 1 } : a));
    return { success: true } as unknown as T;
  }

  // 3. CASES
  if (cleanEndpoint === '/cases') {
    if (method === 'POST') {
      const newCase = {
        id: 'case_' + Date.now(),
        case_number: `CASE-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: parsedBody?.title || 'New Investigation Case',
        description: parsedBody?.description || '',
        department_id: parsedBody?.department_id || 'dept_inv',
        department_name: 'Investigation Division',
        department_code: 'INV',
        sensitivity_level: parsedBody?.sensitivity_level || 'CONFIDENTIAL',
        status: 'ACTIVE' as const,
        creator_name: currentUser.fullName,
        member_count: 1,
        document_count: 0,
        evidence_count: 0,
        created_at: new Date().toISOString(),
      };
      MOCK_CASES.unshift(newCase);
      return { case: newCase } as unknown as T;
    }
    return { cases: MOCK_CASES } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/cases/')) {
    const parts = cleanEndpoint.split('/');
    const caseId = parts[2];

    if (parts[3] === 'assign' && method === 'POST') {
      const targetUserId = parsedBody?.userId;
      const targetUser = Object.values(MOCK_USERS).find((u) => u.id === targetUserId);
      if (targetUser) {
        if (!MOCK_CASE_MEMBERS[caseId]) MOCK_CASE_MEMBERS[caseId] = [];
        MOCK_CASE_MEMBERS[caseId].push({
          id: 'cm_' + Date.now(),
          case_id: caseId,
          user_id: targetUser.id,
          full_name: targetUser.fullName,
          email: targetUser.email,
          badge_number: targetUser.badgeNumber,
          role: targetUser.role,
          role_in_case: parsedBody?.roleInCase || 'INVESTIGATOR',
          assigned_at: new Date().toISOString(),
        });
      }
      return { success: true } as unknown as T;
    }

    const foundCase = MOCK_CASES.find((c) => c.id === caseId) || MOCK_CASES[3];
    const caseDocs = docsState.filter((d) => d.case_id === caseId);
    const caseEvidence = evidenceState.filter((e) => e.case_id === caseId);
    const caseMembers = MOCK_CASE_MEMBERS[caseId] || [];

    return {
      case: foundCase,
      documents: caseDocs,
      evidence: caseEvidence,
      members: caseMembers,
    } as unknown as T;
  }

  // 4. DOCUMENTS
  if (cleanEndpoint === '/docs') {
    // ABAC Clearance check: Inv B (Marcus Vance) cannot see Case 104 docs directly
    if (currentUser.id === 'user_inv_b') {
      return {
        documents: docsState.filter((d) => d.case_id !== 'case_104'),
      } as unknown as T;
    }
    return { documents: docsState } as unknown as T;
  }

  if (cleanEndpoint === '/docs/upload' && method === 'POST') {
    const newDoc: DocumentRecord = {
      id: 'doc_' + Date.now(),
      title: (body instanceof FormData ? (body.get('title') as string) : parsedBody?.title) || 'Uploaded Investigation Evidence',
      original_filename: (body instanceof FormData ? (body.get('file') as any)?.name : parsedBody?.filename) || 'Evidence_File.pdf',
      mime_type: 'application/pdf',
      file_size: 1536000,
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      encryption_algo: 'aes-256-gcm',
      case_id: 'case_104',
      case_number: 'CASE-2026-104',
      case_title: 'Operation Nightshade: Vehicle Syndicate & Identity Forgery',
      department_id: 'dept_inv',
      department_name: 'Investigation Division',
      owner_id: currentUser.id,
      owner_name: currentUser.fullName,
      sensitivity_level: 'CONFIDENTIAL',
      current_version: 1,
      status: 'ACTIVE',
      ai_classification: 'Investigation Evidence',
      ai_confidence: 0.95,
      ai_summary: 'Encrypted with authenticated AES-256-GCM envelope. SHA-256 hash anchored into tamper-evident ledger.',
      aiEntities: [
        { type: 'CASE_ID', value: 'CASE-2026-104' },
        { type: 'LOCATION', value: 'Sector 62' },
      ],
      ocr_extracted_text: 'AUTHENTICATED EVIDENCE INTAKE RECORD\nEncrypted with AES-256-GCM.\nIntegrity SHA-256 anchored.\nForensic extraction completed.',
      is_tampered_demo: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: ['Evidence', 'Upload', 'Case-104'],
    };
    docsState.unshift(newDoc);
    return { document: newDoc } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/docs/')) {
    const parts = cleanEndpoint.split('/');
    const docId = parts[2];
    const subAction = parts[3];

    // Check Case 104 authorization for Inv B (Demonstrates 403 Forbidden in Hackathon Demo)
    if (currentUser.id === 'user_inv_b' && (docId.includes('104') || docId === 'doc_fir_104')) {
      throw new ApiError(403, 'Access Denied: You are not assigned to CASE-2026-104 (Operation Nightshade)');
    }

    const docIndex = docsState.findIndex((d) => d.id === docId);
    const doc = docIndex >= 0 ? docsState[docIndex] : docsState[0];

    if (subAction === 'signature') {
      return { signature: doc?.digitalSignature || null } as unknown as T;
    }

    if (subAction === 'preview') {
      return (doc?.ocr_extracted_text || 'Decrypted document preview unavailable.') as unknown as T;
    }

    if (subAction === 'verify-integrity') {
      if (doc?.is_tampered_demo === 1) {
        return {
          status: 'COMPROMISED',
          message: 'CRITICAL: File integrity check failed! Calculated SHA-256 hash does not match genesis hash.',
          registeredHash: doc.sha256_hash,
          computedHash: 'baad0000deadbeefbaad0000deadbeefbaad0000deadbeefbaad0000deadbeef',
          verifiedAt: new Date().toISOString(),
        } as unknown as T;
      }
      return {
        status: 'VERIFIED',
        message: 'Cryptographic SHA-256 integrity verified against immutable anchor.',
        registeredHash: doc?.sha256_hash,
        computedHash: doc?.sha256_hash,
        verifiedAt: new Date().toISOString(),
      } as unknown as T;
    }

    if (subAction === 'tamper-demo') {
      if (docIndex >= 0) docsState[docIndex].is_tampered_demo = 1;
      return { success: true, message: 'Document bit corrupted for demonstration.' } as unknown as T;
    }

    if (subAction === 'reset-tamper') {
      if (docIndex >= 0) docsState[docIndex].is_tampered_demo = 0;
      return { success: true, message: 'Document restored to genesis hash.' } as unknown as T;
    }

    if (subAction === 'sign') {
      const newSig = {
        id: 'sig_' + Date.now(),
        document_id: docId,
        signer_id: currentUser.id,
        signer_name: currentUser.fullName,
        signed_hash: doc?.sha256_hash || '3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b',
        signature_hex: 'f4e3d2c1b0a99887766554433221100ffeeddccbbaa99887766554433221100f',
        key_fingerprint: 'SHA256:7f8e9d0c1b2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
        algorithm: 'RSA-PSS-SHA256-4096',
        certificate_authority: 'SecureVault Root Authority (Internal Justice CA)',
        signed_at: new Date().toISOString(),
      };
      if (docIndex >= 0) docsState[docIndex].digitalSignature = newSig;
      return { signature: newSig } as unknown as T;
    }

    if (subAction === 'ai') {
      return { success: true } as unknown as T;
    }

    return { document: doc } as unknown as T;
  }

  // 5. EVIDENCE & CUSTODY
  if (cleanEndpoint === '/evidence') {
    if (method === 'POST') {
      const newEv: EvidenceRecord = {
        id: 'ev_' + Date.now(),
        evidence_number: `EV-104-${String.fromCharCode(65 + evidenceState.length)}`,
        title: parsedBody?.title || 'Physical Seizure Item',
        description: parsedBody?.description || '',
        case_id: parsedBody?.case_id || 'case_104',
        case_number: 'CASE-2026-104',
        current_custodian_id: currentUser.id,
        custodian_name: currentUser.fullName,
        badge_number: currentUser.badgeNumber,
        status: 'IN_CUSTODY',
        storage_location: parsedBody?.storage_location || 'Secure Armory Box 104',
        integrity_hash: '9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e',
        collected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      evidenceState.unshift(newEv);
      return { evidence: newEv } as unknown as T;
    }
    return { evidence: evidenceState } as unknown as T;
  }

  if (cleanEndpoint.startsWith('/evidence/')) {
    const parts = cleanEndpoint.split('/');
    const evId = parts[2];
    const subAction = parts[3];

    const ev = evidenceState.find((e) => e.id === evId) || evidenceState[0];

    if (subAction === 'transfer' && method === 'POST') {
      const newEvent: CustodyEvent = {
        id: 'cust_' + Date.now(),
        evidence_id: evId,
        case_id: ev.case_id,
        previous_custodian: ev.custodian_name || 'Previous Custodian',
        new_custodian: parsedBody?.newCustodian || 'Forensic Lab Analyst',
        action: parsedBody?.action || 'TRANSFER_OF_CUSTODY',
        reason: parsedBody?.reason || 'Court submission preparation',
        timestamp: new Date().toISOString(),
        performed_by_id: currentUser.id,
        performed_by_name: currentUser.fullName,
        badge_number: currentUser.badgeNumber,
        integrity_hash: ev.integrity_hash,
        signature_status: 'VERIFIED',
      };
      if (!custodyEventsState[evId]) custodyEventsState[evId] = [];
      custodyEventsState[evId].push(newEvent);

      // Update current custodian
      const evIdx = evidenceState.findIndex((e) => e.id === evId);
      if (evIdx >= 0) {
        evidenceState[evIdx].custodian_name = parsedBody?.newCustodian || 'Transferee';
      }
      return { success: true, event: newEvent } as unknown as T;
    }

    const timeline = custodyEventsState[evId] || custodyEventsState['ev_104_a'] || [];
    return { evidence: ev, custodyTimeline: timeline } as unknown as T;
  }

  // 6. AUDIT
  if (cleanEndpoint === '/audit/logs') {
    return { logs: auditLogsState, total: auditLogsState.length } as unknown as T;
  }

  if (cleanEndpoint === '/audit/verify-chain') {
    if (isAuditTampered) {
      return {
        status: 'TAMPERED',
        totalEntries: auditLogsState.length,
        brokenIndex: 2,
        details: 'Discrepancy detected at entry #2: Previous hash does not match recalculation.',
      } as unknown as T;
    }
    return {
      status: 'VERIFIED',
      totalEntries: auditLogsState.length,
      details: 'All audit blocks cryptographically linked to Genesis state.',
    } as unknown as T;
  }

  if (cleanEndpoint === '/audit/tamper-demo') {
    isAuditTampered = true;
    return { success: true } as unknown as T;
  }

  if (cleanEndpoint === '/audit/repair-chain') {
    isAuditTampered = false;
    return { success: true } as unknown as T;
  }

  // 7. GRAPH
  if (cleanEndpoint === '/graph') {
    return MOCK_GRAPH_DATA as unknown as T;
  }

  // 8. SEARCH
  if (cleanEndpoint === '/search') {
    return {
      documents: docsState,
      cases: MOCK_CASES,
      evidence: evidenceState,
    } as unknown as T;
  }

  // 9. SHARING & ACCESS REQUESTS
  if (cleanEndpoint === '/access-requests') {
    return {
      requests: [
        {
          id: 'req_1',
          document_id: 'doc_fir_104',
          document_title: 'First Information Report - Case 104',
          sensitivity_level: 'CONFIDENTIAL',
          user_id: 'user_inv_b',
          requester_name: 'Detective Marcus Vance',
          requester_email: 'inv.b@securevault.local',
          badge_number: 'SV-INV-102',
          case_id: 'case_104',
          case_number: 'CASE-2026-104',
          reason: 'Corroborating vehicle license plate with Case 102 syndicate leads.',
          duration_hours: 4,
          status: 'PENDING',
          created_at: '2026-08-16T10:00:00Z',
        },
      ],
    } as unknown as T;
  }

  // 10. PUBLIC QR VERIFY
  if (cleanEndpoint.startsWith('/system/public-verify/')) {
    const doc = docsState[0];
    return {
      valid: true,
      document: {
        title: doc.title,
        caseNumber: doc.case_number,
        sha256: doc.sha256_hash,
        signature: doc.digitalSignature,
        issuedAt: doc.created_at,
      },
    } as unknown as T;
  }

  return {} as unknown as T;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('securevault_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Try real backend if VITE_API_URL is configured or local server is reachable
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const contentType = res.headers.get('content-type') || '';

    // If server responded with valid JSON
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    // If 403 or other known API error with JSON body
    if (!res.ok && contentType.includes('application/json')) {
      let errorMsg = `Request failed (${res.status})`;
      let errData = null;
      try {
        errData = await res.json();
        errorMsg = errData.error || errData.message || errorMsg;
      } catch {}
      throw new ApiError(res.status, errorMsg, errData);
    }

    // If it returned HTML (e.g. Vercel SPA rewrite fallback for /api/* without backend) or 404
    // seamlessly use rich mock engine
    return handleMockRequest<T>(endpoint, options.method || 'GET', options.body);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    // Network offline / backend not running -> use rich mock dispatcher
    return handleMockRequest<T>(endpoint, options.method || 'GET', options.body);
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  download: async (endpoint: string, defaultFilename: string) => {
    try {
      const token = sessionStorage.getItem('securevault_token');
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (res.ok && !res.headers.get('content-type')?.includes('text/html')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch {}

    // Fallback: create downloadable mock text file
    const blob = new Blob([`[SECUREVAULT DECRYPTED EVIDENCE EXPORT]\nFilename: ${defaultFilename}\nSecurity Classification: RESTRICTED\nIntegrity: Cryptographically Verified`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename.replace(/\.pdf$/, '.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
