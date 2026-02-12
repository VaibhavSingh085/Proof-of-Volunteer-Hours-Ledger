/**
 * Upload or verify a PDF (or any file) with LegalDocVault
 *
 * Upload:  npx tsx scripts/upload-pdf.ts <file-path>
 * Verify:  npx tsx scripts/upload-pdf.ts --verify <file-path> <document-id>
 *
 * Ensure the backend is running: npm run backend
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.LEGALDOC_API ?? "http://localhost:3000";

async function upload(filePath: string) {
  const resolved = resolve(filePath);
  console.log(`Reading: ${resolved}`);

  const content = readFileSync(resolved);
  const contentBase64 = content.toString("base64");
  const fileName = resolved.split(/[/\\]/).pop() ?? "document.pdf";

  const res = await fetch(`${BASE}/api/documents/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBase64, fileName }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed (${res.status}): ${err}`);
  }

  const doc = (await res.json()) as {
    id: string;
    docId: string;
    commitment: string;
    createdAt: string;
  };

  console.log("\n✓ Document uploaded successfully\n");
  console.log("  ID:        ", doc.id);
  console.log("  DocId:     ", doc.docId);
  console.log("  File:      ", fileName);
  console.log("\nTo verify later:");
  console.log(`  npx tsx scripts/upload-pdf.ts --verify "${filePath}" ${doc.id}`);
}

async function verify(filePath: string, docId: string) {
  const resolved = resolve(filePath);
  console.log(`Reading: ${resolved}`);

  const content = readFileSync(resolved);
  const contentBase64 = content.toString("base64");

  const res = await fetch(`${BASE}/api/documents/${encodeURIComponent(docId)}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentBase64 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Verify failed (${res.status}): ${err}`);
  }

  const result = (await res.json()) as { valid: boolean };
  if (result.valid) {
    console.log("\n✓ Document authenticity verified.\n");
  } else {
    console.log("\n✗ Document does not match stored commitment.\n");
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const isVerify = args[0] === "--verify";

if (isVerify && args.length >= 3) {
  verify(args[1], args[2]).catch(handleErr);
} else if (!isVerify && args.length >= 1) {
  upload(args[0]).catch(handleErr);
} else {
  console.error("Usage:");
  console.error("  Upload:  npx tsx scripts/upload-pdf.ts <file-path>");
  console.error('  Verify:  npx tsx scripts/upload-pdf.ts --verify <file-path> <document-id>');
  console.error("");
  console.error('Example (Windows):');
  console.error('  npx tsx scripts/upload-pdf.ts "C:\\Users\\shado\\Downloads\\RL\\Deep_Q_Learning.pdf"');
  process.exit(1);
}

function handleErr(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Error:", msg);
  if (msg.includes("fetch") || msg.includes("ECONNREFUSED")) {
    console.error("\nIs the backend running? Start it with: npm run backend");
  }
  process.exit(1);
}
