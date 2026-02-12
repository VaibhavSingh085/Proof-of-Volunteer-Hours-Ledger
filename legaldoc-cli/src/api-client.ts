/**
 * HTTP client for LegalDocVault backend API
 * Uses native fetch (Node 18+)
 */

export interface DocumentResponse {
  id: string;
  docId: string;
  commitment: string;
  contentHash: string;
  nonce?: string;
  fileName?: string;
  mimeType?: string;
  createdAt: string;
  registeredOnChain?: boolean;
}

export interface VerifyResponse {
  valid: boolean;
  docId: string;
  commitment: string;
}

export const documentClient = {
  async upload(baseUrl: string, body: { contentBase64: string; fileName?: string; mimeType?: string }): Promise<DocumentResponse> {
    const res = await fetch(`${baseUrl}/api/documents/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error ?? "Upload failed");
    }
    return (await res.json()) as DocumentResponse;
  },

  async list(baseUrl: string): Promise<DocumentResponse[]> {
    const res = await fetch(`${baseUrl}/api/documents`);
    if (!res.ok) throw new Error("Failed to list documents");
    return (await res.json()) as DocumentResponse[];
  },

  async get(baseUrl: string, id: string): Promise<DocumentResponse> {
    const res = await fetch(`${baseUrl}/api/documents/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("Document not found");
      throw new Error("Failed to get document");
    }
    return (await res.json()) as DocumentResponse;
  },

  async verify(baseUrl: string, id: string, body: { contentBase64: string }): Promise<VerifyResponse> {
    const res = await fetch(`${baseUrl}/api/documents/${encodeURIComponent(id)}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Verification failed");
    return (await res.json()) as VerifyResponse;
  },
};
