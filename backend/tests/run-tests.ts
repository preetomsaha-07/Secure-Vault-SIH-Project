import request from 'supertest';
import app from '../src/index.js';
import { getDb } from '../src/db/db.js';
import { seedDemoData } from '../src/db/seed.js';
import { Aes256GcmCipher } from '../src/crypto/cipher.js';
import { CryptoHasher } from '../src/crypto/hasher.js';
import { DigitalSignatureEngine } from '../src/crypto/signatures.js';
import { AuditService } from '../services/auditService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n================================================================');
  console.log('🔒 SECUREVAULT: EXECUTING CRITICAL SECURITY ACCEPTANCE TESTS');
  console.log('================================================================\n');

  // Seed fresh demo state
  await seedDemoData();
  const db = await getDb();

  // Obtain tokens for personas
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@securevault.local', password: 'Password123!' });
  const adminToken = adminRes.body.token;

  const invARes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'inv.a@securevault.local', password: 'Password123!' });
  const invAToken = invARes.body.token;

  const invBRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'inv.b@securevault.local', password: 'Password123!' });
  const invBToken = invBRes.body.token;

  const auditorRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'auditor@securevault.local', password: 'Password123!' });
  const auditorToken = auditorRes.body.token;

  assert(Boolean(adminToken && invAToken && invBToken && auditorToken), 'Authentication: All 4 persona tokens generated');

  // -------------------------------------------------------------------------
  // TEST 1: Investigator A cannot access Case B (Unassigned case access denied)
  // -------------------------------------------------------------------------
  // Investigator A is assigned to case_104 & case_101. Investigator A is NOT assigned to case_102.
  const t1Res = await request(app)
    .get('/api/cases/case_102')
    .set('Authorization', `Bearer ${invAToken}`);
  assert(t1Res.status === 403, 'Test 1: Investigator A cannot access unassigned Case 102 (403 Forbidden)', `Got ${t1Res.status}`);

  // -------------------------------------------------------------------------
  // TEST 2: Investigator B cannot access Investigator A's confidential document
  // -------------------------------------------------------------------------
  // Investigator B attempts to view or download doc_fir_104 (Case 104)
  const t2Res = await request(app)
    .get('/api/docs/doc_fir_104')
    .set('Authorization', `Bearer ${invBToken}`);
  assert(t2Res.status === 403, "Test 2: Investigator B cannot access Investigator A's confidential document in Case 104 (403 Forbidden)", `Got ${t2Res.status}`);

  // Also verify unauthorized attempt logged to audit
  const auditAttempt = await db.get<any>(
    `SELECT count(*) as count FROM audit_logs WHERE action = 'UNAUTHORIZED_DOCUMENT_ACCESS_ATTEMPT'`
  );
  assert(auditAttempt.count > 0, 'Test 2b: Unauthorized access attempt recorded in tamper-evident audit ledger');

  // -------------------------------------------------------------------------
  // TEST 3: Auditor cannot modify documents or create unauthorized records
  // -------------------------------------------------------------------------
  const t3Res = await request(app)
    .post('/api/docs/doc_fir_104/tamper-demo')
    .set('Authorization', `Bearer ${auditorToken}`);
  // Auditor has READ only on documents, write requires authorized owner/admin
  assert(t3Res.status === 403, 'Test 3: Auditor cannot modify or tamper documents (Read-Only Governance)', `Got ${t3Res.status}`);

  // -------------------------------------------------------------------------
  // TEST 4: Frontend / Client cannot bypass backend authorization
  // -------------------------------------------------------------------------
  const t4Res = await request(app).get('/api/docs/doc_fir_104');
  assert(t4Res.status === 401, 'Test 4: Unauthenticated direct API request rejected (401 Unauthorized)', `Got ${t4Res.status}`);

  // -------------------------------------------------------------------------
  // TEST 5 & 6: Expired and Revoked Share Links
  // -------------------------------------------------------------------------
  // Create an expired share link directly
  const expiredToken = 'expired_test_token_' + Date.now();
  await db.run(
    `INSERT INTO share_links (id, document_id, created_by, token, can_download, expires_at, created_at)
     VALUES ($1, 'doc_fir_104', 'user_inv_a', $2, 1, datetime('now', '-2 hours'), datetime('now', '-5 hours'))`,
    ['share_exp_1', expiredToken]
  );
  const t5Res = await request(app).get(`/api/share/doc/${expiredToken}`);
  assert(t5Res.status === 410, 'Test 5: Expired share link rejected with 410 Gone', `Got ${t5Res.status}`);

  // Create a revoked share link
  const revokedToken = 'revoked_test_token_' + Date.now();
  await db.run(
    `INSERT INTO share_links (id, document_id, created_by, token, is_revoked, expires_at, created_at)
     VALUES ($1, 'doc_fir_104', 'user_inv_a', $2, 1, datetime('now', '+24 hours'), datetime('now'))`,
    ['share_rev_1', revokedToken]
  );
  const t6Res = await request(app).get(`/api/share/doc/${revokedToken}`);
  assert(t6Res.status === 410, 'Test 6: Revoked share link rejected with 410 Gone', `Got ${t6Res.status}`);

  // -------------------------------------------------------------------------
  // TEST 7: Modified document fails integrity verification
  // -------------------------------------------------------------------------
  // Mark doc_rep_104 as tampered demo
  await request(app)
    .post('/api/docs/doc_rep_104/tamper-demo')
    .set('Authorization', `Bearer ${adminToken}`);

  const t7Res = await request(app)
    .post('/api/docs/doc_rep_104/verify-integrity')
    .set('Authorization', `Bearer ${adminToken}`);

  assert(
    t7Res.body.status === 'COMPROMISED' && t7Res.body.verified === false,
    'Test 7: Modified document fails SHA-256 integrity verification (🚨 DOCUMENT INTEGRITY COMPROMISED)'
  );

  // Restore document
  await request(app)
    .post('/api/docs/doc_rep_104/reset-tamper')
    .set('Authorization', `Bearer ${adminToken}`);

  const t7RestoreRes = await request(app)
    .post('/api/docs/doc_rep_104/verify-integrity')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(t7RestoreRes.body.status === 'VERIFIED', 'Test 7b: Restored document verified authentic (✅ INTEGRITY VERIFIED)');

  // -------------------------------------------------------------------------
  // TEST 8: Modified audit event causes hash-chain verification failure
  // -------------------------------------------------------------------------
  // First verify pristine chain
  const chainInitialRes = await request(app)
    .post('/api/audit/verify-chain')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(chainInitialRes.body.status === 'VERIFIED', 'Test 8a: Pristine hash chain verifies 100% from Genesis');

  // Tamper with audit record
  await request(app)
    .post('/api/audit/tamper-demo')
    .set('Authorization', `Bearer ${adminToken}`);

  const chainTamperedRes = await request(app)
    .post('/api/audit/verify-chain')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(
    chainTamperedRes.body.status === 'COMPROMISED',
    'Test 8b: Modified audit event causes cryptographic hash-chain verification failure (🚨 AUDIT CHAIN INTEGRITY FAILED)'
  );

  // Repair chain
  await request(app)
    .post('/api/audit/repair-chain')
    .set('Authorization', `Bearer ${adminToken}`);
  const chainRepairedRes = await request(app)
    .post('/api/audit/verify-chain')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(chainRepairedRes.body.status === 'VERIFIED', 'Test 8c: Repaired audit chain verified intact');

  // -------------------------------------------------------------------------
  // TEST 9: Digital signature verification & modification detection
  // -------------------------------------------------------------------------
  const t9Res = await request(app)
    .get('/api/docs/doc_fir_104/signature')
    .set('Authorization', `Bearer ${invAToken}`);
  assert(
    t9Res.body.hasSignature && t9Res.body.verification.status === 'VALID',
    'Test 9: Asymmetric RSA-PSS digital signature verifies successfully (✅ SIGNATURE VALID)'
  );

  // -------------------------------------------------------------------------
  // TEST 10 & 11: No secret keys or AWS credentials exposed in API
  // -------------------------------------------------------------------------
  const docDetailsRes = await request(app)
    .get('/api/docs/doc_fir_104')
    .set('Authorization', `Bearer ${invAToken}`);
  const bodyStr = JSON.stringify(docDetailsRes.body);
  assert(
    !bodyStr.includes('MASTER_ENCRYPTION_KEY') &&
      !bodyStr.includes('JWT_SECRET') &&
      !bodyStr.includes('AWS_SECRET_ACCESS_KEY'),
    'Test 10 & 11: No encryption master keys or AWS credentials exposed in client responses'
  );

  // -------------------------------------------------------------------------
  // TEST 12: AES-256-GCM cipher roundtrip & auth-tag tamper rejection
  // -------------------------------------------------------------------------
  const key = Buffer.alloc(32, 0x42);
  const testPlaintext = Buffer.from('CONFIDENTIAL LEGAL TEST RECORD 2026', 'utf8');
  const encResult = Aes256GcmCipher.encrypt(testPlaintext, key);
  const decPlaintext = Aes256GcmCipher.decrypt(encResult.combined, key);
  assert(decPlaintext.toString('utf8') === testPlaintext.toString('utf8'), 'Test 12a: AES-256-GCM roundtrip encryption/decryption succeeds');

  // Tamper 1 byte of ciphertext payload
  const tamperedCombined = Buffer.from(encResult.combined);
  tamperedCombined[tamperedCombined.length - 1] ^= 0xff;
  let tagFailed = false;
  try {
    Aes256GcmCipher.decrypt(tamperedCombined, key);
  } catch {
    tagFailed = true;
  }
  assert(tagFailed, 'Test 12b: Modified AES-256-GCM payload strictly rejected by authentication tag');

  // -------------------------------------------------------------------------
  // TEST 13: Predictable ID enumeration protection (UUID authorization)
  // -------------------------------------------------------------------------
  const fakeDocRes = await request(app)
    .get('/api/docs/00000000-0000-0000-0000-000000000001')
    .set('Authorization', `Bearer ${invAToken}`);
  assert(fakeDocRes.status === 404, 'Test 13: Non-existent predictable ID enumeration safely returns 404', `Got ${fakeDocRes.status}`);

  // -------------------------------------------------------------------------
  // TEST 14: Unauthorized users cannot access sensitive document metadata
  // -------------------------------------------------------------------------
  const t14Res = await request(app)
    .get('/api/docs/doc_fir_104')
    .set('Authorization', `Bearer ${invBToken}`);
  assert(
    t14Res.status === 403 && !t14Res.body.title && !t14Res.body.filename,
    'Test 14: Unauthorized user response contains generic error and zero metadata leakage'
  );

  console.log('\n================================================================');
  console.log(`TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('[TEST SUITE FATAL ERROR]', err);
  process.exit(1);
});
