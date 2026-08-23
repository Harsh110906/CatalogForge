# ⚡ CatalogForge: AI-Powered Industrial Catalog Enrichment & 2026 Agentic Commerce Workspace

> **Transforming fragmented supplier product data into structured, validated, explainable, and commerce-ready product records — natively compliant with 2026 AI Agentic Commerce standards (OpenAI/Stripe ACP & Google UCP).**

---

## 🌟 Overview

**CatalogForge** is a full-stack enterprise web application built to address a critical challenge in industrial distribution: supplier data fragmentation. Industrial product records (circuit breakers, power supplies, VFDs, sensors, terminal blocks) arrive in raw, inconsistent CSV/Excel files missing GTIN barcodes, ETIM classifications, and electrical specifications.

CatalogForge combines **Google Gemini AI**, **Cross-Field Engineering Validation**, **Model Context Protocol (MCP)** integration, and **Agentic Commerce Compliance Scoring** into a unified workspace.

---

## 🔥 Key Features

- **📥 Multi-Supplier Ingestion Hub**: Upload raw CSV/Excel files with automated Gemini AI column mapping and ETIM taxonomy alignment.
- **⚡ AI Enrichment Engine**: Generates titles, descriptions, technical attributes, key bullet highlights, and Q&A pairs for enterprise AI purchasing agents.
- **🛡️ Validation & Golden Benchmark Engine**: Enforces GTIN-13 validation and compares supplier SKUs against category Golden Benchmarks.
- **👥 Human-in-the-Loop Approval Queue**: Adjustable confidence threshold slider for reviewing AI suggestions before publishing.
- **🤖 2026 Agentic Commerce Readiness (ACP & UCP)**: Real-time scoring against **OpenAI/Stripe ACP** and **Google UCP** with visibility tier classification (`TRUSTED`, `PENALIZED`, `INVISIBLE`).
- **🔌 Model Context Protocol (MCP) Server**: Native JSON-RPC 2.0 endpoint (`/api/mcp`) allowing AI assistants to query products programmatically.
- **🎨 Coinbase White & Electric Blue Design**: Clean, user-friendly UI with high-contrast surfaces (`#ffffff`, `#0052ff`, `#0f172a`).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend & API**: Next.js API Routes, Model Context Protocol (MCP JSON-RPC 2.0)
- **Database & ORM**: PostgreSQL / SQLite with Prisma ORM & In-Memory Fallback Provider
- **AI Integration**: Google Gemini API for enrichment and schema mapping
- **Auth & Access Control**: Multi-Role Session System (`ADMIN`, `EDITOR`, `SUPPLIER`, `VIEWER`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Harsh110906/CatalogForge.git
   cd CatalogForge
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Initialize Prisma Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
