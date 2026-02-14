# Migration Plan: Supabase → Local PostgreSQL + Ollama First-Class Provider

## Executive Summary

This document outlines the complete migration strategy to transform Open Canvas from a cloud-dependent application (Supabase) to a fully local, privacy-focused stack using PostgreSQL with pgvector and Ollama as a first-class streaming provider.

**Timeline:** 12 phases (sequential execution recommended)
**Risk Level:** Medium - affects authentication, storage, and LLM integration
**Rollback Strategy:** Git feature branch with incremental commits

---

## Current Architecture Overview

### Cloud Dependencies Identified

1. **Supabase Authentication** (CRITICAL BLOCKER)
   - Login/Signup flows in `apps/web/src/components/auth/`
   - OAuth providers (Google, GitHub)
   - User verification middleware in API routes
   - Missing library files: `@/lib/supabase/server`, `@/lib/supabase/client`, `@/lib/supabase/verify_user_server`

2. **Supabase Storage** (MEDIUM)
   - Audio transcription uploads: `apps/web/src/lib/attachments.tsx:58-96`
   - Document storage for context retrieval
   - Environment vars: `NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS`, `NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS`

3. **User Context** (LOW - Already using localStorage fallback)
   - `apps/web/src/contexts/UserContext.tsx` - Currently has dummy local user
   - Reflections and custom quick actions stored locally

### OpenAI-Specific Provider Logic

1. **Model Configuration** (`packages/shared/src/models.ts`)
   - Default model: `ollama-gpt-oss-32k:latest` (line 675) ✓ GOOD
   - Ollama models marked with "MUST" prefix (lines 500-550)
   - OpenAI still listed as primary provider in UI

2. **Agent-Side Model Loading**
   - `apps/agents/src/model-config.ts` - Runtime model resolution
   - `apps/agents/src/utils/model.ts` - Creates ChatOpenAI instances for all providers
   - Currently disables `tool_choice` for local models (NEEDS FIX)

3. **Environment Configuration**
   - `OPENAI_API_KEY` required (NEEDS REMOVAL)
   - `NEXT_PUBLIC_OLLAMA_ENABLED=false` (NEEDS DEFAULT TRUE)
   - Ollama base URL defaults to `http://host.docker.internal:11434` ✓ GOOD

### LangGraph State Management

**NO CHANGES REQUIRED** - Current architecture uses LangGraph SDK:
- Thread state via `client.threads.updateState()`
- Store (KV) via `client.store.putItem()`
- No direct database dependencies in agent code

**IMPORTANT:** All data persistence currently happens through LangGraph API server, which can be configured to use PostgreSQL backend.

---

## Target Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                 │
│  - No Auth Flow (direct access)                     │
│  - Local storage for preferences                    │
│  - Streaming UI for Ollama                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  LangGraph API (Port 54367)                         │
│  - Thread management                                │
│  - Streaming coordination                           │
│  - PostgreSQL backend for persistence               │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐    ┌─────────────────┐
│ PostgreSQL    │    │ Ollama          │
│ + pgvector    │    │ (Port 11434)    │
│               │    │                 │
│ - Users       │    │ - llama3.3      │
│ - Threads     │    │ - big-tiger-27b │
│ - Assistants  │    │ - gpt-oss-32k   │
│ - Documents   │    │                 │
│ - Embeddings  │    │ Streaming:      │
│               │    │ ✓ Tool calls    │
└───────────────┘    │ ✓ Partial tokens│
                     └─────────────────┘
```

---

## Migration Phases

### Phase 1: Database Setup
**Status:** PENDING
**Risk:** LOW
**Dependencies:** None

#### Tasks:
1. Create `docker-compose.yml` in root:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: pgvector/pgvector:pg16
       environment:
         POSTGRES_DB: opencanvas
         POSTGRES_USER: opencanvas
         POSTGRES_PASSWORD: opencanvas_local
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./migrations:/docker-entrypoint-initdb.d

     ollama:
       image: ollama/ollama:latest
       ports:
         - "11434:11434"
       volumes:
         - ollama_data:/root/.ollama

   volumes:
     postgres_data:
     ollama_data:
   ```

2. Create database schema in `migrations/001_initial_schema.sql`:
   ```sql
   -- Enable pgvector extension
   CREATE EXTENSION IF NOT EXISTS vector;

   -- Users table (simplified - no auth needed)
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255),
     username VARCHAR(100) DEFAULT 'local-user',
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Documents table (replacing Supabase Storage)
   CREATE TABLE documents (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     filename VARCHAR(500),
     content_type VARCHAR(100),
     file_data BYTEA,
     file_size BIGINT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Vector embeddings for semantic search
   CREATE TABLE document_embeddings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
     chunk_text TEXT,
     embedding vector(1536),  -- Adjust dimension based on embedding model
     metadata JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create index for vector similarity search
   CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops);

   -- Reflections table (user style rules and memories)
   CREATE TABLE reflections (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     reflection_type VARCHAR(50),
     content TEXT,
     metadata JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Custom quick actions
   CREATE TABLE custom_quick_actions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     name VARCHAR(200),
     prompt TEXT,
     icon VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Insert default local user
   INSERT INTO users (id, email, username)
   VALUES ('00000000-0000-0000-0000-000000000001', 'local@local.com', 'local-user');
   ```

3. Create Prisma schema in `prisma/schema.prisma`:
   ```prisma
   generator client {
     provider = "prisma-client-js"
     previewFeatures = ["postgresqlExtensions"]
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     extensions = [vector]
   }

   model User {
     id        String   @id @default(uuid()) @db.Uuid
     email     String?  @db.VarChar(255)
     username  String   @default("local-user") @db.VarChar(100)
     createdAt DateTime @default(now()) @map("created_at")

     documents           Document[]
     reflections         Reflection[]
     customQuickActions  CustomQuickAction[]

     @@map("users")
   }

   model Document {
     id          String   @id @default(uuid()) @db.Uuid
     userId      String   @map("user_id") @db.Uuid
     filename    String   @db.VarChar(500)
     contentType String   @map("content_type") @db.VarChar(100)
     fileData    Bytes    @map("file_data")
     fileSize    BigInt   @map("file_size")
     createdAt   DateTime @default(now()) @map("created_at")

     user       User                 @relation(fields: [userId], references: [id])
     embeddings DocumentEmbedding[]

     @@map("documents")
   }

   model DocumentEmbedding {
     id         String   @id @default(uuid()) @db.Uuid
     documentId String   @map("document_id") @db.Uuid
     chunkText  String   @map("chunk_text")
     embedding  Unsupported("vector(1536)")
     metadata   Json?
     createdAt  DateTime @default(now()) @map("created_at")

     document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

     @@map("document_embeddings")
   }

   model Reflection {
     id             String   @id @default(uuid()) @db.Uuid
     userId         String   @map("user_id") @db.Uuid
     reflectionType String   @map("reflection_type") @db.VarChar(50)
     content        String
     metadata       Json?
     createdAt      DateTime @default(now()) @map("created_at")

     user User @relation(fields: [userId], references: [id])

     @@map("reflections")
   }

   model CustomQuickAction {
     id        String   @id @default(uuid()) @db.Uuid
     userId    String   @map("user_id") @db.Uuid
     name      String   @db.VarChar(200)
     prompt    String
     icon      String   @db.VarChar(50)
     createdAt DateTime @default(now()) @map("created_at")

     user User @relation(fields: [userId], references: [id])

     @@map("custom_quick_actions")
   }
   ```

#### Validation:
- [ ] `docker-compose up -d postgres` starts successfully
- [ ] Connect to PostgreSQL: `psql -h localhost -U opencanvas -d opencanvas`
- [ ] Verify pgvector extension: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- [ ] Verify tables created: `\dt`

---

### Phase 2: Remove Supabase Dependencies from Frontend
**Status:** PENDING
**Risk:** MEDIUM
**Dependencies:** Phase 1 complete

#### Tasks:

1. **Delete authentication UI components:**
   - Remove `apps/web/src/components/auth/login/` directory
   - Remove `apps/web/src/components/auth/signup/` directory
   - Remove `apps/web/src/app/auth/` directory (routes)

2. **Update UserContext to use local-only mode:**
   - File: `apps/web/src/contexts/UserContext.tsx`
   - Replace Supabase integration with hardcoded local user
   - Keep localStorage for preferences

3. **Remove Supabase environment variables:**
   - Delete from `apps/web/.env.example`:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS
     NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS
     ```
   - Delete from root `.env.example`:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE
     ```

4. **Replace document storage in attachments:**
   - File: `apps/web/src/lib/attachments.tsx`
   - Replace `transcribeAudio()` Supabase upload with direct API upload
   - Create new route: `apps/web/src/app/api/documents/upload/route.ts`

5. **Remove Supabase dependencies from package.json:**
   - Delete `@supabase/supabase-js` from `apps/web/package.json`

#### Validation:
- [ ] Application loads without authentication
- [ ] No console errors about missing Supabase config
- [ ] Local user context initializes correctly

---

### Phase 3: Replace API Route Authentication
**Status:** PENDING
**Risk:** LOW
**Dependencies:** Phase 2 complete

#### Tasks:

1. **Create stub auth library:**
   - File: `apps/web/src/lib/auth/verify-user.ts`
   ```typescript
   // Local-only auth - always returns the default local user
   export async function verifyUserAuthenticated() {
     return {
       id: '00000000-0000-0000-0000-000000000001',
       email: 'local@local.com',
       username: 'local-user'
     };
   }
   ```

2. **Update API routes:**
   - `apps/web/src/app/api/store/get/route.ts` - Replace import
   - `apps/web/src/app/api/store/put/route.ts` - Replace import
   - `apps/web/src/app/api/store/delete/route.ts` - Replace import
   - `apps/web/src/app/api/store/delete/id/route.ts` - Replace import
   - Change from: `import { verifyUserAuthenticated } from '@/lib/supabase/verify_user_server'`
   - Change to: `import { verifyUserAuthenticated } from '@/lib/auth/verify-user'`

3. **Update API proxy:**
   - File: `apps/web/src/app/api/[..._path]/route.ts`
   - Remove 401 authentication stub
   - Allow all requests through

#### Validation:
- [ ] `/api/store/get` returns data without auth errors
- [ ] API proxy forwards requests successfully

---

### Phase 4: Implement PostgreSQL Document Storage
**Status:** PENDING
**Risk:** MEDIUM
**Dependencies:** Phase 1, 2, 3 complete

#### Tasks:

1. **Add Prisma to web app:**
   ```bash
   cd apps/web
   npm install @prisma/client
   npm install -D prisma
   ```

2. **Create Prisma client singleton:**
   - File: `apps/web/src/lib/db/prisma.ts`
   ```typescript
   import { PrismaClient } from '@prisma/client'

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined
   }

   export const prisma = globalForPrisma.prisma ?? new PrismaClient()

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```

3. **Create document upload API:**
   - File: `apps/web/src/app/api/documents/upload/route.ts`
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { prisma } from '@/lib/db/prisma'
   import { verifyUserAuthenticated } from '@/lib/auth/verify-user'

   export async function POST(req: NextRequest) {
     const user = await verifyUserAuthenticated()
     const formData = await req.formData()
     const file = formData.get('file') as File

     if (!file) {
       return NextResponse.json({ error: 'No file provided' }, { status: 400 })
     }

     const bytes = await file.arrayBuffer()
     const buffer = Buffer.from(bytes)

     const document = await prisma.document.create({
       data: {
         userId: user.id,
         filename: file.name,
         contentType: file.type,
         fileData: buffer,
         fileSize: BigInt(file.size)
       }
     })

     return NextResponse.json({
       id: document.id,
       filename: document.filename,
       url: `/api/documents/${document.id}`
     })
   }
   ```

4. **Create document retrieval API:**
   - File: `apps/web/src/app/api/documents/[id]/route.ts`

5. **Update attachments.tsx to use new API:**
   - Replace Supabase upload in `transcribeAudio()` function
   - Update document processing functions

#### Validation:
- [ ] Upload audio file successfully
- [ ] Retrieve document by ID
- [ ] File size limits enforced

---

### Phase 5: Ollama Configuration & Environment Updates
**Status:** PENDING
**Risk:** LOW
**Dependencies:** None (can run in parallel)

#### Tasks:

1. **Update root `.env.example`:**
   ```env
   # LangChain Tracing (Optional)
   LANGCHAIN_TRACING_V2="false"
   LANGCHAIN_API_KEY=""

   # Local Ollama (Primary Provider)
   OLLAMA_API_URL=http://localhost:11434

   # Optional: Cloud Providers
   # ANTHROPIC_API_KEY=""
   # OPENAI_API_KEY=""
   # GROQ_API_KEY=""
   # GOOGLE_API_KEY=""
   # FIREWORKS_API_KEY=""

   # Optional: LiteLLM Proxy
   # LITELLM_BASE_URL=http://host.docker.internal:4000

   # Database
   DATABASE_URL="postgresql://opencanvas:opencanvas_local@localhost:5432/opencanvas"

   # Document Processing
   FIRECRAWL_API_KEY=""
   ```

2. **Update `apps/web/.env.example`:**
   ```env
   # LangGraph API
   LANGGRAPH_API_URL=http://localhost:54367

   # Local Ollama (Enabled by default)
   NEXT_PUBLIC_OLLAMA_ENABLED=true
   OLLAMA_API_URL="http://localhost:11434"

   # Optional: Enable cloud providers
   NEXT_PUBLIC_FIREWORKS_ENABLED=false
   NEXT_PUBLIC_GEMINI_ENABLED=false
   NEXT_PUBLIC_ANTHROPIC_ENABLED=false
   NEXT_PUBLIC_OPENAI_ENABLED=false

   # Document Processing
   GROQ_API_KEY=
   FIRECRAWL_API_KEY=

   # Database
   DATABASE_URL="postgresql://opencanvas:opencanvas_local@localhost:5432/opencanvas"
   ```

3. **Update `apps/agents/.env.example`:**
   ```env
   # Local Ollama (Primary Provider)
   OLLAMA_API_URL=http://localhost:11434

   # Optional: Cloud Providers
   # ANTHROPIC_API_KEY=""
   # OPENAI_API_KEY=""

   # Optional: LangChain Tracing
   # LANGCHAIN_TRACING_V2="false"
   # LANGCHAIN_API_KEY=""

   # Database
   DATABASE_URL="postgresql://opencanvas:opencanvas_local@localhost:5432/opencanvas"
   ```

4. **Update Docker Compose to include LangGraph server:**
   ```yaml
   langgraph:
     build:
       context: .
       dockerfile: Dockerfile.agents
     ports:
       - "54367:8123"
     environment:
       - DATABASE_URL=postgresql://opencanvas:opencanvas_local@postgres:5432/opencanvas
       - OLLAMA_API_URL=http://ollama:11434
     depends_on:
       - postgres
       - ollama
   ```

#### Validation:
- [ ] Environment variables load correctly
- [ ] Docker Compose starts all services
- [ ] Ollama accessible at http://localhost:11434

---

### Phase 6: Make Ollama Default Provider in Model Configuration
**Status:** PENDING
**Risk:** LOW
**Dependencies:** Phase 5 complete

#### Tasks:

1. **Update `packages/shared/src/models.ts`:**
   - Move Ollama models to top of `MODEL_CONFIG` export (lines 1-100)
   - Remove "MUST" prefix from Ollama model names
   - Update default model constant:
     ```typescript
     export const DEFAULT_MODEL = "ollama-llama3.3:latest";
     ```
   - Add prominent comment:
     ```typescript
     // ============================================
     // PRIMARY PROVIDER: Ollama (Local, No API Key)
     // ============================================
     ```

2. **Update `apps/web/src/components/chat-interface/model-selector/index.tsx`:**
   - Group models by provider
   - Show Ollama models first
   - Add visual indicator for local models (e.g., "🏠 Local")
   - Hide cloud providers if feature flags disabled

3. **Update model display names:**
   - "ollama-llama3.3:latest" → "Llama 3.3 (Local)"
   - "ollama-big-tiger-27b:latest" → "Big Tiger 27B (Local)"
   - "ollama-gpt-oss-32k:latest" → "GPT OSS 32K (Local)"

#### Validation:
- [ ] Model selector shows Ollama models first
- [ ] Default model is Ollama on new threads
- [ ] Model display names are user-friendly

---

### Phase 7: Remove OpenAI API Key Requirements
**Status:** PENDING
**Risk:** MEDIUM
**Dependencies:** Phase 6 complete

#### Tasks:

1. **Update `apps/agents/src/model-config.ts`:**
   - Remove OpenAI API key validation
   - Make `apiKey` optional for Ollama provider:
   ```typescript
   export function getModelConfig(customModelName?: string) {
     const { modelName, provider, baseUrl } = getCustomModelFromName(customModelName);

     if (provider === 'ollama') {
       return {
         modelName,
         configuration: {
           baseURL: baseUrl || process.env.OLLAMA_API_URL || 'http://localhost:11434/v1',
           apiKey: 'ollama', // Dummy key, not validated
         }
       };
     }

     // For cloud providers, require API key
     const apiKey = getApiKeyForProvider(provider);
     if (!apiKey && provider !== 'ollama') {
       throw new Error(`API key required for provider: ${provider}`);
     }

     return { modelName, configuration: { apiKey, baseURL: baseUrl } };
   }
   ```

2. **Update `apps/agents/src/utils/model.ts`:**
   - Remove `tool_choice` disabling for Ollama
   - Enable streaming tool calls:
   ```typescript
   export function getModelFromConfig(config: ModelConfig) {
     const { modelName, provider } = config;

     if (provider === 'ollama') {
       return new ChatOpenAI({
         modelName,
         configuration: {
           baseURL: process.env.OLLAMA_API_URL || 'http://localhost:11434/v1',
           apiKey: 'ollama'
         },
         streaming: true,
         // REMOVED: toolChoice: undefined (enable tool calling)
       });
     }

     // Cloud providers...
   }
   ```

3. **Create startup validation script:**
   - File: `apps/agents/src/lib/validate-ollama.ts`
   ```typescript
   export async function validateOllamaConnection() {
     const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

     try {
       const response = await fetch(`${baseUrl}/api/tags`);
       if (!response.ok) {
         throw new Error(`Ollama not responding: ${response.status}`);
       }

       const data = await response.json();
       console.log('✓ Ollama connected. Available models:', data.models?.map(m => m.name).join(', '));
       return true;
     } catch (error) {
       console.error('✗ Ollama connection failed:', error.message);
       console.error('  Make sure Ollama is running: docker-compose up ollama');
       return false;
     }
   }
   ```

4. **Add validation to LangGraph server startup:**
   - Import and call `validateOllamaConnection()` in main server file

#### Validation:
- [ ] Agent starts without `OPENAI_API_KEY`
- [ ] Ollama models respond to prompts
- [ ] Tool calling works with Ollama
- [ ] Startup script detects missing Ollama service

---

### Phase 8: Fix Ollama Streaming Tool Calls
**Status:** PENDING
**Risk:** HIGH
**Dependencies:** Phase 7 complete

#### Tasks:

1. **Verify Ollama tool calling schema compatibility:**
   - Test with `ollama-llama3.3:latest` model
   - Ensure tools are passed in OpenAI-compatible format
   - File: `apps/agents/src/open-canvas/nodes/*.ts`

2. **Update streaming handler in web worker:**
   - File: `apps/web/src/workers/graph-stream/stream.worker.ts`
   - Ensure tool call deltas are parsed correctly
   - Handle partial JSON in streaming responses

3. **Test tool calling with Ollama:**
   - Generate new artifact (tests `generateArtifact` node)
   - Update existing artifact (tests `updateArtifact` node)
   - Web search (tests `webSearch` node with tools)
   - Custom actions (tests `customAction` node)

4. **Add fallback for non-streaming models:**
   - Some Ollama models may not support streaming
   - Detect and fall back to non-streaming mode:
   ```typescript
   export function getModelFromConfig(config: ModelConfig) {
     const streaming = config.supportsStreaming ?? true;

     return new ChatOpenAI({
       modelName: config.modelName,
       streaming,
       // ...
     });
   }
   ```

5. **Update UI to show tool call progress:**
   - File: `apps/web/src/contexts/GraphContext.tsx`
   - Display "Calling tool: generateArtifact..." during streaming
   - Show tool results incrementally

#### Validation:
- [ ] Ollama streams tokens correctly
- [ ] Tool calls execute without errors
- [ ] UI updates in real-time during streaming
- [ ] No hanging or timeout issues
- [ ] Partial tokens render correctly in CodeMirror

---

### Phase 9: Update Vector Embeddings to Local
**Status:** PENDING
**Risk:** MEDIUM
**Dependencies:** Phase 4 complete

#### Tasks:

1. **Choose local embedding model:**
   - Option 1: Ollama with `nomic-embed-text` model
   - Option 2: HuggingFace Transformers.js in-browser
   - **Recommendation:** Ollama for consistency

2. **Install Ollama embedding model:**
   ```bash
   docker-compose exec ollama ollama pull nomic-embed-text
   ```

3. **Create embedding service:**
   - File: `apps/web/src/lib/embeddings/generate.ts`
   ```typescript
   import { prisma } from '@/lib/db/prisma'

   export async function generateEmbedding(text: string): Promise<number[]> {
     const baseUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

     const response = await fetch(`${baseUrl}/api/embeddings`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         model: 'nomic-embed-text',
         prompt: text
       })
     });

     const data = await response.json();
     return data.embedding;
   }

   export async function storeDocumentEmbedding(documentId: string, chunkText: string, metadata?: any) {
     const embedding = await generateEmbedding(chunkText);

     await prisma.$executeRaw`
       INSERT INTO document_embeddings (document_id, chunk_text, embedding, metadata)
       VALUES (${documentId}::uuid, ${chunkText}, ${embedding}::vector, ${metadata}::jsonb)
     `;
   }
   ```

4. **Create semantic search API:**
   - File: `apps/web/src/app/api/search/semantic/route.ts`
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'
   import { generateEmbedding } from '@/lib/embeddings/generate'
   import { prisma } from '@/lib/db/prisma'

   export async function POST(req: NextRequest) {
     const { query, limit = 5 } = await req.json()

     const queryEmbedding = await generateEmbedding(query)

     const results = await prisma.$queryRaw`
       SELECT
         de.chunk_text,
         de.metadata,
         d.filename,
         1 - (de.embedding <=> ${queryEmbedding}::vector) as similarity
       FROM document_embeddings de
       JOIN documents d ON de.document_id = d.id
       ORDER BY de.embedding <=> ${queryEmbedding}::vector
       LIMIT ${limit}
     `

     return NextResponse.json(results)
   }
   ```

5. **Update document upload to auto-generate embeddings:**
   - Modify `apps/web/src/app/api/documents/upload/route.ts`
   - Chunk large documents
   - Generate embeddings for each chunk

6. **Integrate semantic search in agent context:**
   - Update context documents retrieval to use semantic search
   - File: `apps/web/src/components/assistant-select/context-documents/index.tsx`

#### Validation:
- [ ] Ollama generates embeddings successfully
- [ ] Embeddings stored in PostgreSQL
- [ ] Semantic search returns relevant results
- [ ] Vector similarity search performs well (< 100ms for 1000 documents)

---

### Phase 10: Remove Cloud-Related UI Elements
**Status:** PENDING
**Risk:** LOW
**Dependencies:** Phase 2 complete

#### Tasks:

1. **Audit UI for cloud references:**
   - Search for "Account", "Sign In", "Sign Out", "Subscription", "Cloud Sync"
   - Files to check:
     - `apps/web/src/components/header/`
     - `apps/web/src/components/sidebar/`
     - `apps/web/src/app/layout.tsx`

2. **Remove authentication UI elements:**
   - Delete "Sign In" button from header
   - Remove user profile dropdown (if exists)
   - Remove any subscription/billing components

3. **Update application layout:**
   - File: `apps/web/src/app/layout.tsx`
   - Remove authentication checks
   - Load directly into canvas interface

4. **Update landing page (if exists):**
   - Remove "Get Started" → "Sign Up" flow
   - Change to "Launch Open Canvas" → Direct to main app

5. **Clean up navigation:**
   - Remove `/auth/*` routes from navigation
   - Remove protected route middleware

#### Validation:
- [ ] No authentication UI visible
- [ ] Application loads directly to canvas
- [ ] No broken links to removed pages

---

### Phase 11: Update Documentation & README
**Status:** PENDING
**Risk:** LOW
**Dependencies:** All phases 1-10 complete

#### Tasks:

1. **Update README.md:**
   - Add "🏠 Fully Local & Private" badge
   - Update architecture diagram
   - Remove Supabase setup instructions
   - Add PostgreSQL + Ollama setup instructions

2. **Create LOCAL_SETUP.md:**
   ```markdown
   # Local Setup Guide

   ## Prerequisites
   - Docker & Docker Compose
   - Node.js 18+

   ## Quick Start

   1. Clone the repository
   2. Start services: `docker-compose up -d`
   3. Install dependencies: `npm install`
   4. Run migrations: `npm run db:migrate`
   5. Pull Ollama models: `docker-compose exec ollama ollama pull llama3.3`
   6. Start frontend: `npm run dev`
   7. Open: http://localhost:3000

   ## Available Ollama Models
   - llama3.3:latest (Default)
   - big-tiger-27b:latest
   - gpt-oss-32k:latest

   To add more: `docker-compose exec ollama ollama pull <model-name>`
   ```

3. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "dev": "npm run dev --workspaces --if-present",
       "build": "npm run build --workspaces --if-present",
       "db:migrate": "prisma migrate deploy",
       "db:studio": "prisma studio",
       "docker:up": "docker-compose up -d",
       "docker:down": "docker-compose down",
       "ollama:pull": "docker-compose exec ollama ollama pull",
       "setup": "npm run docker:up && npm install && npm run db:migrate && npm run ollama:pull llama3.3"
     }
   }
   ```

4. **Create ARCHITECTURE.md:**
   - Document new local-first architecture
   - Explain PostgreSQL schema
   - Describe Ollama integration
   - LangGraph state management flow

#### Validation:
- [ ] New users can follow README to set up locally
- [ ] Documentation is accurate and complete

---

### Phase 12: End-to-End Testing
**Status:** PENDING
**Risk:** HIGH
**Dependencies:** All phases 1-11 complete

#### Tasks:

1. **Create test checklist:**
   - [ ] Fresh install from README instructions
   - [ ] Default Ollama model loads
   - [ ] Create new artifact (code)
   - [ ] Create new artifact (text)
   - [ ] Update existing artifact with streaming
   - [ ] Tool calling works (web search, custom action)
   - [ ] Upload document (PDF)
   - [ ] Upload audio file
   - [ ] Semantic search returns relevant results
   - [ ] Thread persistence across page reloads
   - [ ] Assistant creation and configuration
   - [ ] Reflections saved and retrieved
   - [ ] Custom quick actions work
   - [ ] No console errors
   - [ ] No authentication prompts

2. **Performance testing:**
   - Measure streaming latency (should be < 500ms to first token)
   - Test with 100 documents in vector DB
   - Test with 50 threads
   - Monitor memory usage during long conversations

3. **Create integration tests:**
   - File: `tests/integration/local-stack.test.ts`
   - Test all critical user flows
   - Use Playwright for E2E testing

4. **Document known limitations:**
   - Ollama models that don't support tool calling
   - Maximum document size limits
   - Browser compatibility

#### Validation:
- [ ] All test checklist items pass
- [ ] Performance meets targets
- [ ] No regressions in existing functionality

---

## Risk Mitigation Strategies

### High-Risk Areas

1. **Ollama Streaming Tool Calls (Phase 8)**
   - **Risk:** Tool calling format incompatibility
   - **Mitigation:**
     - Test with multiple Ollama models before deployment
     - Implement graceful fallback to non-streaming mode
     - Add detailed error logging for debugging

2. **Database Migration (Phase 1, 4, 9)**
   - **Risk:** Data loss if users have existing Supabase data
   - **Mitigation:**
     - This is a fresh local-only setup (no existing data to migrate)
     - Document that this is NOT an in-place upgrade
     - Provide export/import scripts if needed in future

3. **LangGraph State Management (All Phases)**
   - **Risk:** Breaking existing graph flows
   - **Mitigation:**
     - Do NOT modify `apps/agents/src/open-canvas/index.ts` graph structure
     - Only change model initialization and tool configuration
     - Test each node individually after changes

### Rollback Plan

If critical issues are discovered:

1. **Immediate Rollback:**
   - Revert to previous commit: `git checkout main`
   - Restart services: `docker-compose down && docker-compose up -d`

2. **Partial Rollback:**
   - Keep local PostgreSQL but re-enable Supabase for auth
   - Keep Ollama but allow OpenAI as fallback

3. **Data Recovery:**
   - PostgreSQL data persisted in Docker volume
   - Export with: `docker-compose exec postgres pg_dump -U opencanvas opencanvas > backup.sql`

---

## Success Metrics

### Technical Metrics
- ✅ Zero external API calls (except optional cloud providers)
- ✅ Streaming latency < 500ms to first token
- ✅ Vector search < 100ms for 1000 documents
- ✅ No authentication required to access application
- ✅ All features work with Ollama as primary provider

### User Experience Metrics
- ✅ Application launches directly to canvas (no login screen)
- ✅ Default model is Ollama (no API key required)
- ✅ Document upload and search work locally
- ✅ No "cloud sync" or "subscription" UI elements visible

### Privacy & Portability Metrics
- ✅ All data stored in local PostgreSQL
- ✅ All LLM calls go to local Ollama instance
- ✅ Can run completely offline (after initial setup)
- ✅ `docker-compose down` cleanly stops all services
- ✅ Data export/import scripts available

---

## Post-Migration Tasks

1. **Update CI/CD:**
   - Add Docker Compose to GitHub Actions
   - Test against multiple Ollama models
   - Add integration tests to pipeline

2. **Community Feedback:**
   - Create GitHub Discussion for local-only setup
   - Document common issues and solutions
   - Gather feedback on Ollama model recommendations

3. **Future Enhancements:**
   - Add model download UI (manage Ollama models from web interface)
   - Implement vector DB admin panel
   - Add data export/import tools
   - Support for local embedding model alternatives

---

## Appendix A: File Modification Checklist

### Files to DELETE:
- [ ] `apps/web/src/components/auth/login/`
- [ ] `apps/web/src/components/auth/signup/`
- [ ] `apps/web/src/app/auth/`

### Files to CREATE:
- [ ] `docker-compose.yml`
- [ ] `migrations/001_initial_schema.sql`
- [ ] `prisma/schema.prisma`
- [ ] `apps/web/src/lib/db/prisma.ts`
- [ ] `apps/web/src/lib/auth/verify-user.ts`
- [ ] `apps/web/src/app/api/documents/upload/route.ts`
- [ ] `apps/web/src/app/api/documents/[id]/route.ts`
- [ ] `apps/web/src/lib/embeddings/generate.ts`
- [ ] `apps/web/src/app/api/search/semantic/route.ts`
- [ ] `apps/agents/src/lib/validate-ollama.ts`
- [ ] `LOCAL_SETUP.md`
- [ ] `ARCHITECTURE.md`
- [ ] `tests/integration/local-stack.test.ts`

### Files to MODIFY:
- [ ] `.env.example` (root)
- [ ] `apps/web/.env.example`
- [ ] `apps/agents/.env.example`
- [ ] `apps/web/src/contexts/UserContext.tsx`
- [ ] `apps/web/src/lib/attachments.tsx`
- [ ] `apps/web/src/app/api/store/get/route.ts`
- [ ] `apps/web/src/app/api/store/put/route.ts`
- [ ] `apps/web/src/app/api/store/delete/route.ts`
- [ ] `apps/web/src/app/api/store/delete/id/route.ts`
- [ ] `apps/web/src/app/api/[..._path]/route.ts`
- [ ] `packages/shared/src/models.ts`
- [ ] `apps/web/src/components/chat-interface/model-selector/index.tsx`
- [ ] `apps/agents/src/model-config.ts`
- [ ] `apps/agents/src/utils/model.ts`
- [ ] `apps/web/src/workers/graph-stream/stream.worker.ts`
- [ ] `apps/web/src/contexts/GraphContext.tsx`
- [ ] `README.md`
- [ ] `package.json` (root)
- [ ] `apps/web/package.json`
- [ ] `apps/web/src/app/layout.tsx`

---

## Appendix B: Dependencies to Add

### Root package.json:
```json
{
  "devDependencies": {
    "prisma": "^6.0.0"
  }
}
```

### apps/web/package.json:
```json
{
  "dependencies": {
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0"
  }
}
```

### Remove from apps/web/package.json:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "..."  // DELETE
  }
}
```

---

## Appendix C: Environment Variables Summary

### Before (Supabase):
```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE=""
NEXT_PUBLIC_SUPABASE_URL_DOCUMENTS=""
NEXT_PUBLIC_SUPABASE_ANON_KEY_DOCUMENTS=""
```

### After (Local PostgreSQL + Ollama):
```env
DATABASE_URL="postgresql://opencanvas:opencanvas_local@localhost:5432/opencanvas"
OLLAMA_API_URL=http://localhost:11434
NEXT_PUBLIC_OLLAMA_ENABLED=true
```

### Removed Requirements:
- ❌ `OPENAI_API_KEY` (now optional)
- ❌ All Supabase variables
- ❌ Authentication environment variables

---

## Timeline Estimate

**IMPORTANT:** Per project guidelines, no time estimates are provided. Each phase should be completed fully and tested before moving to the next. Phases can be worked on in parallel where dependencies allow.

**Recommended Execution Order:**
1. Phases 1, 5 (parallel) - Infrastructure setup
2. Phases 2, 3 (sequential) - Remove Supabase auth
3. Phase 4 - Implement PostgreSQL storage
4. Phases 6, 7 (sequential) - Ollama configuration
5. Phase 8 - Fix streaming (critical path)
6. Phases 9, 10 (parallel) - Embeddings & UI cleanup
7. Phase 11 - Documentation
8. Phase 12 - Testing

---

## Conclusion

This migration plan transforms Open Canvas from a cloud-dependent application to a fully local, privacy-focused development environment. The key achievements will be:

1. **🔒 Privacy First:** All data stays local (PostgreSQL + pgvector)
2. **🚀 Ollama Streaming:** First-class tool calling support
3. **🏠 No Cloud Dependencies:** No Supabase, no required API keys
4. **✨ Seamless UX:** Direct access to canvas, no authentication barriers

The plan is designed to be executed incrementally with clear validation steps and rollback options at each phase.
