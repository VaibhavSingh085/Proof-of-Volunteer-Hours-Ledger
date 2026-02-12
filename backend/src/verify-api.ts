/**
 * API verification script - runs without user interaction
 * Usage: npm run verify (from backend) or npm run verify -w backend (from root)
 * Ensure the backend is running (npm run backend) before executing.
 */

import { Buffer } from "node:buffer";

const BASE = process.env.LEGALDOC_API ?? "http://localhost:3000";

async function request(method: string, path: string, body?: unknown): Promise<Record<string, unknown> | unknown[]> {
  const url = `${BASE}${path}`;
  const opts: RequestInit = { method };
  if (body) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url);
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  return data as Record<string, unknown> | unknown[];
}

async function main() {
  console.log("LegalDocVault API verification\n");
  console.log(`Base URL: ${BASE}\n`);

  try {
    // 1. Health check
    console.log("1. GET /api/health");
    const health = await request("GET", "/api/health") as Record<string, unknown>;
    if (!health.status) throw new Error("Health check failed: " + JSON.stringify(health));
    console.log("   ✓", health, "\n");

    // 2. Root
    console.log("2. GET /");
    const root = await request("GET", "/") as Record<string, unknown>;
    if (!root.name) throw new Error("Root check failed: " + JSON.stringify(root));
    console.log("   ✓", root, "\n");

    // 3. Upload document
    const content = "Legal Document - Verification Test\nDate: " + new Date().toISOString();
    const contentBase64 = Buffer.from(content, "utf-8").toString("base64");
    console.log("3. POST /api/documents (upload)");
    const uploaded = await request("POST", "/api/documents/upload", {
      contentBase64,
      fileName: "verify-test.txt",
    }) as Record<string, unknown>;

    const docId = uploaded.id as string | undefined;
    const docIdAlt = uploaded.docId as string | undefined;

    if (!docId && !docIdAlt) {
      throw new Error(
        `Upload failed: response missing id and docId. Full response: ${JSON.stringify(uploaded)}`
      );
    }

    const idToUse = docId ?? docIdAlt!;
    console.log("   ✓ Document ID:", docId ?? "(using docId)");
    console.log("   ✓ DocId:", String(docIdAlt ?? idToUse).slice(0, 32) + "...\n");

    // 4. List documents
    console.log("4. GET /api/documents (list)");
    const list = await request("GET", "/api/documents");
    const docs = Array.isArray(list) ? list : [];
    if (docs.length === 0) {
      throw new Error("Upload succeeded but list returned 0 documents. Backend may need restart.");
    }
    console.log("   ✓ Documents:", docs.length, "\n");

    // 5. Get document by ID
    console.log("5. GET /api/documents/:id");
    const doc = await request("GET", `/api/documents/${encodeURIComponent(idToUse)}`) as Record<string, unknown>;
    if (!doc.id && !doc.docId) {
      throw new Error("Get document failed: " + JSON.stringify(doc));
    }
    console.log("   ✓ Found:", doc.id ?? doc.docId, "\n");

    // 6. Verify document
    console.log("6. POST /api/documents/:id/verify");
    const verify = await request("POST", `/api/documents/${encodeURIComponent(idToUse)}/verify`, {
      contentBase64,
    }) as Record<string, unknown>;
    if (verify.valid !== true) {
      throw new Error("Verification failed: " + JSON.stringify(verify));
    }
    console.log("   ✓ Valid:", verify.valid, "\n");

    // 7. Hash utility
    console.log("7. POST /api/documents/hash");
    const hashRes = await request("POST", "/api/documents/hash", { contentBase64 }) as Record<string, unknown>;
    if (!hashRes.hash || typeof hashRes.hash !== "string") {
      throw new Error("Hash endpoint failed: " + JSON.stringify(hashRes));
    }
    console.log("   ✓ Hash:", String(hashRes.hash).slice(0, 32) + "...\n");

    console.log("All checks passed. API is working correctly.\n");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Verification failed:", msg);
    if (
      msg.includes("fetch") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("Unable to connect") ||
      msg.includes("NetworkError")
    ) {
      console.error("\nIs the backend running? Start it with: npm run backend");
    }
    if (msg.includes("0 documents")) {
      console.error("\nTry restarting the backend (Ctrl+C then npm run backend) and run verify again.");
    }
    process.exit(1);
  }
}

main();
