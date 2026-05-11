import { logger } from '@/lib/logger';

const log = logger.child({ service: 'dms-engine' });

/**
 * P-14: DMS Deep — in-memory store (document/documentVersion not in schema)
 * Full check-in/out, versioning, search
 */

interface DocVersion { versionNumber: string; fileUrl: string; uploadedBy: number; changeNote?: string; createdAt: Date }
interface DocRecord  { id: number; tenantId: string; title: string; tags: string; checkedOutBy?: number; checkedOutAt?: Date; versions: DocVersion[] }

const docs = new Map<number, DocRecord>();
let docSeq = 1;

export class DMSEngine {
  static createDocument(tenantId: string, title: string, tags: string, fileUrl: string, uploadedBy: number): DocRecord {
    const id = docSeq++;
    const doc: DocRecord = { id, tenantId, title, tags, versions: [{ versionNumber: '1.0', fileUrl, uploadedBy, createdAt: new Date() }] };
    docs.set(id, doc);
    log.info(`DMS: document created "${title}" id=${id}`);
    return doc;
  }

  static uploadVersion(documentId: number, fileUrl: string, uploadedBy: number, changeNote?: string): DocVersion {
    const doc = docs.get(documentId); if (!doc) throw new Error(`Document ${documentId} not found`);
    const last = doc.versions[doc.versions.length - 1];
    const parts = (last?.versionNumber ?? '1.0').split('.').map(Number);
    parts[1] = (parts[1] ?? 0) + 1;
    const version: DocVersion = { versionNumber: parts.join('.'), fileUrl, uploadedBy, changeNote, createdAt: new Date() };
    doc.versions.push(version);
    log.info(`DMS: document ${documentId} → version ${version.versionNumber}`);
    return version;
  }

  static checkOut(documentId: number, userId: number): DocRecord {
    const doc = docs.get(documentId); if (!doc) throw new Error(`Document ${documentId} not found`);
    if (doc.checkedOutBy && doc.checkedOutBy !== userId) throw new Error(`Document locked by user ${doc.checkedOutBy}`);
    doc.checkedOutBy = userId; doc.checkedOutAt = new Date();
    return doc;
  }

  static checkIn(documentId: number, userId: number, fileUrl: string, changeNote?: string): DocVersion {
    const doc = docs.get(documentId); if (!doc) throw new Error(`Document ${documentId} not found`);
    if (doc.checkedOutBy !== userId) throw new Error('You did not check out this document');
    doc.checkedOutBy = undefined; doc.checkedOutAt = undefined;
    return this.uploadVersion(documentId, fileUrl, userId, changeNote);
  }

  static getVersionHistory(documentId: number): DocVersion[] {
    return docs.get(documentId)?.versions ?? [];
  }

  static search(tenantId: string, query: string): DocRecord[] {
    const q = query.toLowerCase();
    return Array.from(docs.values()).filter(d => d.tenantId === tenantId && (d.title.toLowerCase().includes(q) || d.tags.toLowerCase().includes(q)));
  }
}
