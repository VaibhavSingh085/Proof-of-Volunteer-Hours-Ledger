/**
 * LegalDocVault Backend - REST API for legal document management
 * Provides document storage, hash computation, and authenticity verification
 */

import express from "express";
import cors from "cors";
import { documentRouter } from "./routes/documents.js";
import { healthRouter } from "./routes/health.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/health", healthRouter);
app.use("/api/documents", documentRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "LegalDocVault API",
    version: "0.1.0",
    docs: "/api/documents",
    health: "/api/health",
  });
});

app.listen(PORT, () => {
  console.log(`LegalDocVault API running at http://localhost:${PORT}`);
});
