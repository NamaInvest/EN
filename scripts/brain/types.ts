export type EvidenceTag =
  | 'VERIFIED_BY_CODE'
  | 'VERIFIED_BY_SCHEMA'
  | 'VERIFIED_BY_TEST'
  | 'VERIFIED_BY_COMMAND'
  | 'VERIFIED_BY_REPORT'
  | 'STRUCTURE_VERIFIED_ONLY'
  | 'PLAN_ONLY'
  | 'CLAIMED_ONLY'
  | 'PARTIAL'
  | 'NEEDS_EVIDENCE'
  | 'NOT_VERIFIED'
  | 'PRODUCTION_NOT_VERIFIED'
  | 'STOPPED_REQUIRES_EXPLICIT_APPROVAL'
  | 'ARCHIVE_REPORT'
  | 'OUTDATED_DOC'
  | 'SOURCE_DOC';

export type BrainEntryStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'CLOSED'
  | 'PROPOSED'
  | 'IMPLEMENTED'
  | 'SUPERSEDED';

export interface BrainReportEntry {
  date: string;
  title: string;
  path: string;
  purpose: string;
  evidenceStatus: EvidenceTag;
  notes?: string;
}

export interface BrainRiskEntry {
  id: string;
  risk: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceStatus: EvidenceTag;
  mitigation: string;
  status: BrainEntryStatus;
}

export interface BrainGapEntry {
  id: string;
  gap: string;
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW' | 'P4_LATER';
  evidenceStatus: EvidenceTag;
  recommendation: string;
  status: BrainEntryStatus;
}
