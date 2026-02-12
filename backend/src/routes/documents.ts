/**
 * Document API routes - upload, retrieve, verify
 */

import { Router, Request, Response } from "express";
import {
  registerDocument,
  getDocument,
  getDocumentByDocId,
  listDocuments,
  sha256,
  verifyCommitment,
  type DocumentRecord,
} from "../services/document-store.js";

export const documentRouter = Router();

const uploadHandler = (req: Request, res: Response) => {
  try {
    const { contentBase64, fileName, mimeType } = req.body ?? {};
    if (!contentBase64) {
      return res.status(400).json({ error: "Missing contentBase64 in body" });
    }
    const content = Buffer.from(contentBase64, "base64");
    const record = registerDocument(content, { fileName, mimeType });
    return res.status(201).json(formatDocumentResponse(record));
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Failed to register document" });
  }
};

/** POST /api/documents/upload - Upload a document */
documentRouter.post("/upload", uploadHandler);

/** POST /api/documents - Upload (alias, avoids GET/POST conflict on "") */
documentRouter.post("/", uploadHandler);

/**
 * GET /api/documents
 * List all documents
 */
documentRouter.get("/", (_req: Request, res: Response) => {
  const docs = listDocuments();
  return res.json(docs.map(formatDocumentResponse));
});

/**
 * POST /api/documents/hash - must be before /:id
 */
documentRouter.post("/hash", (req: Request, res: Response) => {
  const { contentBase64 } = req.body ?? {};
  if (!contentBase64) {
    return res.status(400).json({ error: "Provide contentBase64 in body" });
  }
  const content = Buffer.from(contentBase64, "base64");
  const hash = sha256(content);
  return res.json({ hash });
});

/**
 * GET /api/documents/:id
 * Get document metadata by ID or docId
 */
documentRouter.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  let doc = getDocument(id) ?? getDocumentByDocId(id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }
  return res.json(formatDocumentResponse(doc));
});

/**
 * POST /api/documents/:id/verify
 * Verify document authenticity - body: { contentBase64 } (uses stored nonce)
 */
documentRouter.post("/:id/verify", (req: Request, res: Response) => {
  const { id } = req.params;
  const { contentBase64 } = req.body ?? {};
  const doc = getDocument(id) ?? getDocumentByDocId(id);

  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  if (!contentBase64) {
    return res.status(400).json({ error: "Provide contentBase64 in body" });
  }

  const content = Buffer.from(contentBase64, "base64");
  const valid = verifyCommitment(content, doc.nonce, doc.commitment);
  return res.json({ valid, docId: doc.docId, commitment: doc.commitment });
});

function formatDocumentResponse(doc: DocumentRecord) {
  return {
    id: doc.id,
    docId: doc.docId,
    commitment: doc.commitment,
    contentHash: doc.contentHash,
    nonce: doc.nonce,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    createdAt: doc.createdAt,
    registeredOnChain: doc.registeredOnChain,
  };
}
