#!/usr/bin/env node
/**
 * LegalDocVault CLI - Document management interface
 * Uses the backend API for document operations
 */

import inquirer from "inquirer";
import chalk from "chalk";
import { documentClient } from "./api-client.js";

const API_BASE = process.env.LEGALDOC_API ?? "http://localhost:3000";

const BANNER = chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              LegalDocVault                                   ║
║              ─────────────                                   ║
║              Legal document management with verified         ║
║              authenticity & controlled access                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

async function main() {
  console.log(BANNER);
  console.log(chalk.gray(`API: ${API_BASE}\n`));

  while (true) {
    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Upload a document", value: "upload" },
          { name: "List documents", value: "list" },
          { name: "Get document details", value: "get" },
          { name: "Verify document authenticity", value: "verify" },
          { name: "Exit", value: "exit" },
        ],
      },
    ]);

    if (action === "exit") {
      console.log(chalk.green("Goodbye."));
      break;
    }

    try {
      switch (action) {
        case "upload":
          await uploadDocument();
          break;
        case "list":
          await listDocuments();
          break;
        case "get":
          await getDocument();
          break;
        case "verify":
          await verifyDocument();
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`\n✗ Error: ${msg}\n`));
    }
  }
}

async function uploadDocument() {
  const { filePath } = await inquirer.prompt<{ filePath: string }>([
    {
      type: "input",
      name: "filePath",
      message: "Enter file path to upload (or leave empty for demo text):",
      default: "",
    },
  ]);

  let contentBase64: string;
  let fileName: string | undefined;

  if (filePath.trim()) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const content = await fs.readFile(filePath.trim());
    contentBase64 = content.toString("base64");
    fileName = path.basename(filePath.trim());
  } else {
    const demoContent = `Legal Document - Sample Contract\nDate: ${new Date().toISOString()}\nParties: Party A & Party B`;
    contentBase64 = Buffer.from(demoContent, "utf-8").toString("base64");
  }

  const doc = await documentClient.upload(API_BASE, { contentBase64, fileName });
  console.log(chalk.green("\n✓ Document registered successfully\n"));
  console.log(`  ID:        ${doc.id}`);
  console.log(`  DocId:     ${doc.docId}`);
  console.log(`  Commitment: ${doc.commitment.slice(0, 32)}...`);
  console.log(`  Created:   ${doc.createdAt}\n`);
}

async function listDocuments() {
  const docs = await documentClient.list(API_BASE);
  if (docs.length === 0) {
    console.log(chalk.yellow("\nNo documents found.\n"));
    return;
  }
  console.log(chalk.cyan(`\n${docs.length} document(s):\n`));
  for (const d of docs) {
    console.log(`  • ${d.id}`);
    console.log(`    DocId: ${d.docId.slice(0, 24)}... | ${d.fileName ?? "untitled"} | ${d.createdAt}`);
  }
  console.log();
}

async function getDocument() {
  const { id } = await inquirer.prompt<{ id: string }>([
    { type: "input", name: "id", message: "Document ID or DocId:" },
  ]);
  const doc = await documentClient.get(API_BASE, id);
  console.log(chalk.cyan("\nDocument details:\n"));
  console.log(`  ID:             ${doc.id}`);
  console.log(`  DocId:          ${doc.docId}`);
  console.log(`  Commitment:     ${doc.commitment}`);
  console.log(`  Content Hash:   ${doc.contentHash}`);
  console.log(`  Created:        ${doc.createdAt}`);
  console.log(`  On-Chain:       ${doc.registeredOnChain ? "Yes" : "No"}\n`);
}

async function verifyDocument() {
  const { id } = await inquirer.prompt<{ id: string }>([
    { type: "input", name: "id", message: "Document ID to verify:" },
  ]);
  const doc = await documentClient.get(API_BASE, id);
  const { filePath } = await inquirer.prompt<{ filePath: string }>([
    {
      type: "input",
      name: "filePath",
      message: "Path to the document file to verify against:",
    },
  ]);

  const fs = await import("node:fs/promises");
  const content = await fs.readFile(filePath.trim());
  const contentBase64 = content.toString("base64");
  const result = await documentClient.verify(API_BASE, id, { contentBase64 });

  if (result.valid) {
    console.log(chalk.green("\n✓ Document authenticity verified.\n"));
  } else {
    console.log(chalk.red("\n✗ Document does not match stored commitment.\n"));
  }
}

main().catch(console.error);
