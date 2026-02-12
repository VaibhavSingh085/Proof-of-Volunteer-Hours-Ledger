/**
 * Document store - in-memory storage for document metadata and commitments
 * In production, replace with a database (PostgreSQL, MongoDB, etc.)
 */

import { createHash, randomBytes } from "node:crypto";
import { v4 as uuidv4 } from "uuid";

export interface DocumentRecord {
  id: string;
  docId: string; // 32-byte hex (SHA-256) used as contract key
  commitment: string; // 32-byte hex commitment (hash of content + nonce)
  nonce: string; // hex nonce used for commitment (needed for verification)
  contentHash: string; // SHA-256 of raw content
  fileName?: string;
  mimeType?: string;
  createdAt: string;
  registeredOnChain?: boolean;
}

const documents = new Map<string, DocumentRecord>();

/**
 * Compute SHA-256 hash and return as 32-byte hex string
 */
export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a document commitment: hash(content + nonce)
 * The nonce ensures the same content produces different commitments (privacy)
 */
export function computeCommitment(content: Buffer, nonce: Buffer = randomBytes(32)): { commitment: string; nonce: string } {
  const combined = Buffer.concat([content, nonce]);
  const commitment = sha256(combined);
  return { commitment, nonce: nonce.toString("hex") };
}

/**
 * Verify content matches a commitment given the nonce
 */
export function verifyCommitment(content: Buffer, nonce: string, expectedCommitment: string): boolean {
  const nonceBuf = Buffer.from(nonce, "hex");
  const { commitment } = computeCommitment(content, nonceBuf);
  return commitment === expectedCommitment;
}

/**
 * Register a new document
 */
export function registerDocument(content: Buffer, metadata?: { fileName?: string; mimeType?: string }): DocumentRecord {
  const contentHash = sha256(content);
  const docId = contentHash; // Use content hash as docId for simplicity (or derive from metadata)
  const { commitment, nonce } = computeCommitment(content);

  const record: DocumentRecord = {
    id: uuidv4(),
    docId,
    commitment,
    nonce,
    contentHash,
    fileName: metadata?.fileName,
    mimeType: metadata?.mimeType,
    createdAt: new Date().toISOString(),
    registeredOnChain: false,
  };

  documents.set(record.id, record);
  return record;
}

/**
 * Get document by ID
 */
export function getDocument(id: string): DocumentRecord | undefined {
  return documents.get(id);
}

/**
 * Get document by docId (contract key)
 */
export function getDocumentByDocId(docId: string): DocumentRecord | undefined {
  return Array.from(documents.values()).find((d) => d.docId === docId);
}

/**
 * List all documents
 */
export function listDocuments(): DocumentRecord[] {
  return Array.from(documents.values());
}

/**
 * Mark document as registered on-chain
 */
export function markRegisteredOnChain(id: string): void {
  const doc = documents.get(id);
  if (doc) {
    doc.registeredOnChain = true;
    documents.set(id, doc);
  }
}
