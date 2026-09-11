export type UserRole = 'ADMINISTRATOR' | 'INVESTIGATOR' | 'AUDITOR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  badgeNumber?: string;
  role: UserRole;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  mfaEnabled?: boolean;
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  sensitivity_level: 'UNRESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'CLOSED' | 'ARCHIVED';
  creator_name?: string;
  member_count?: number;
  document_count?: number;
  evidence_count?: number;
  created_at: string;
}

export interface CaseMember {
  id: string;
  case_id: string;
  user_id: string;
  full_name: string;
  email: string;
  badge_number?: string;
  role: UserRole;
  role_in_case: string;
  assigned_at: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  encryption_algo: string;
  case_id?: string;
  case_number?: string;
  case_title?: string;
  department_id: string;
  department_name?: string;
  owner_id: string;
  owner_name?: string;
  sensitivity_level: 'UNRESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  current_version: number;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'ARCHIVED' | 'DELETED';
  ai_classification?: string;
  ai_confidence?: number;
  ai_summary?: string;
  ai_entities?: string;
  aiEntities?: Array<{ type: string; value: string }>;
  ocr_extracted_text?: string;
  is_tampered_demo: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  digitalSignature?: DigitalSignatureRecord | null;
  latestIntegrityCheck?: IntegrityRecord | null;
}

export interface DigitalSignatureRecord {
  id: string;
  document_id: string;
  signer_id: string;
  signer_name: string;
  signed_hash: string;
  signature_hex: string;
  key_fingerprint: string;
  algorithm: string;
  certificate_authority: string;
  signed_at: string;
}

export interface IntegrityRecord {
  id: string;
  document_id: string;
  registered_hash: string;
  verified_hash: string;
  status: 'VERIFIED' | 'COMPROMISED';
  verified_by: string;
  verified_at: string;
}

export interface EvidenceRecord {
  id: string;
  evidence_number: string;
  title: string;
  description?: string;
  case_id: string;
  case_number?: string;
  case_title?: string;
  document_id?: string;
  current_custodian_id: string;
  custodian_name?: string;
  badge_number?: string;
  status: string;
  storage_location?: string;
  integrity_hash: string;
  collected_at: string;
  created_at: string;
}

export interface CustodyEvent {
  id: string;
  evidence_id: string;
  case_id: string;
  previous_custodian: string;
  new_custodian: string;
  action: string;
  reason: string;
  purpose?: string;
  location?: string;
  timestamp: string;
  performed_by_id: string;
  performed_by_name?: string;
  badge_number?: string;
  integrity_hash: string;
  signature_status: string;
  verification_status?: 'VERIFIED' | 'PENDING' | 'FLAGGED';
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_path?: string;
  sha256_hash: string;
  file_size: number;
  created_by: string;
  created_by_name?: string;
  badge_number?: string;
  change_summary?: string;
  created_at: string;
  is_current?: boolean;
}

export interface AuditRecord {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_id?: string;
  resource_type?: string;
  case_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
  previous_hash: string;
  current_hash: string;
}

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  user_id?: string;
  user_name?: string;
  case_id?: string;
  case_number?: string;
  description: string;
  reasons: string[];
  risk_score: number;
  is_resolved: number;
  recommended_action?: string;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  document_id: string;
  document_title?: string;
  sensitivity_level?: string;
  user_id: string;
  requester_name?: string;
  requester_email?: string;
  badge_number?: string;
  case_id?: string;
  case_number?: string;
  reason: string;
  duration_hours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expires_at?: string;
  created_at: string;
}

export interface GraphData {
  caseId: string | null;
  nodes: Array<{
    id: string;
    label: string;
    type: 'CASE' | 'DOCUMENT' | 'EVIDENCE' | 'PERSON' | 'VEHICLE' | 'LOCATION' | 'ORGANIZATION';
    sensitivity?: string;
    details?: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
  }>;
  stats: {
    totalNodes: number;
    totalEdges: number;
    casesCount: number;
  };
}

export type AssetStatus =
  | 'REGISTERED'
  | 'ASSIGNED'
  | 'IN_USE'
  | 'TRANSFERRED'
  | 'UNDER_MAINTENANCE'
  | 'INVESTIGATION_BOUND'
  | 'RETURNED'
  | 'RETIRED';

export type AssetType =
  | 'FORENSIC_HARDWARE'
  | 'MOBILE_EXTRACTION'
  | 'BODY_CAMERA'
  | 'SECURE_STORAGE_SAFE'
  | 'TACTICAL_RADIO'
  | 'CRYPTOGRAPHIC_TOKEN'
  | 'SURVEILLANCE_DRONE'
  | 'INVESTIGATION_KIT';

export interface AssetAssignmentEvent {
  id: string;
  asset_id: string;
  officer_id: string;
  officer_name: string;
  badge_number: string;
  action: string;
  timestamp: string;
  case_id?: string;
  case_number?: string;
  notes: string;
}

export interface AssetMaintenanceEvent {
  id: string;
  asset_id: string;
  maintenance_type: string;
  performed_by: string;
  date: string;
  status: 'COMPLETED' | 'SCHEDULED' | 'IN_PROGRESS';
  cost?: string;
  notes: string;
}

export interface PoliceAsset {
  id: string;
  asset_number: string;
  name: string;
  asset_type: AssetType;
  department_id: string;
  department_name: string;
  department_code?: string;
  serial_number: string;
  assigned_officer_id?: string;
  assigned_officer_name?: string;
  assigned_badge_number?: string;
  status: AssetStatus;
  current_location: string;
  related_case_id?: string;
  related_case_number?: string;
  related_evidence_id?: string;
  registered_at: string;
  last_inspected_at?: string;
  assignment_history: AssetAssignmentEvent[];
  maintenance_history: AssetMaintenanceEvent[];
}
