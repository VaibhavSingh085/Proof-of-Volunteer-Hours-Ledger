# LegalDocVault

A legal document management system where sensitive contracts are stored with controlled access and verified authenticity. Built on [Midnight Network](https://docs.midnight.network/) for privacy-preserving document commitments.

## Features

- **Private document storage** – Document content stays off-chain; only commitments (hashes) are stored
- **Controlled access** – REST API for document management with hash-based verification
- **Verified authenticity** – SHA-256 commitments and optional on-chain verification via Midnight
- **TypeScript/JavaScript backend** – Express API for document operations
- **Compact smart contract** – Midnight contract for on-chain document registry

## Project Structure

```
legaldoc-vault/
├── contract/           # Compact smart contract (legaldoc.compact)
├── backend/            # TypeScript REST API (Express)
├── frontend/           # React SPA (Vite)
├── legaldoc-cli/       # Interactive CLI
└── counter-cli/        # Midnight counter example (reference)
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the backend

```bash
npm run backend
```

API runs at `http://localhost:3000`.

### 3. Start the frontend

In a new terminal:

```bash
npm run frontend
```

Frontend runs at `http://localhost:5173` and proxies API requests to the backend.

### 4. (Optional) CLI

```bash
npm run cli
```

## Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/documents/upload` | POST | Upload document (body: `{ contentBase64, fileName?, mimeType? }`) |
| `/api/documents` | GET | List all documents |
| `/api/documents/:id` | GET | Get document metadata |
| `/api/documents/:id/verify` | POST | Verify document (body: `{ contentBase64 }`) |
| `/api/documents/hash` | POST | Compute SHA-256 hash (body: `{ contentBase64 }`) |

### Example: Upload a document

```bash
# PowerShell
$content = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("Contract content"))
Invoke-RestMethod -Uri http://localhost:3000/api/documents -Method POST -Body (@{contentBase64=$content;fileName="contract.txt"} | ConvertTo-Json) -ContentType "application/json"

# Bash / Unix
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d "{\"contentBase64\":\"$(echo -n "Contract content" | base64)\",\"fileName\":\"contract.txt\"}"
```

## Compact Contract

The `legaldoc.compact` contract stores document commitments on the Midnight blockchain:

- **registerDocument(docId, commitment)** – Store a document commitment
- **documentExists(docId)** – Check if a document is registered
- **getCommitment(docId)** – Retrieve the stored commitment for verification

### Compile the contract

1. Install the [Compact compiler](https://docs.midnight.network/getting-started):
   ```bash
   curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/download/compact-v0.4.0/compact-installer.sh | sh
   compact update 0.28.0
   ```

2. Compile:
   ```bash
   cd contract
   npm run compact
   npm run build
   ```

### Contract integration

Once compiled, the contract can be deployed and used with the Midnight network (Preprod/Preview). See `counter-cli` for the wallet and contract deployment flow.

## Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend API port | 3000 |
| `LEGALDOC_API` | API URL for CLI | http://localhost:3000 |
| `VITE_API_URL` | API base URL for frontend (empty = use proxy) | "" |

## Links

- [Midnight Documentation](https://docs.midnight.network/)
- [Compact Language](https://docs.midnight.network/compact)
- [Preprod Faucet](https://faucet.preprod.midnight.network)
