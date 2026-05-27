# TaskFlow — Team Task Manager

A full-stack project management web application built for a hiring assignment. This document explains every architectural decision from first principles.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [First Principles Thinking](#first-principles-thinking)
4. [System Design](#system-design)
5. [Architecture Decisions](#architecture-decisions)
6. [Database Design](#database-design)
7. [Authentication Flow](#authentication-flow)
8. [Role-Based Access Logic](#role-based-access-logic)
9. [API Design](#api-design)
10. [Frontend Structure](#frontend-structure)
11. [Backend Structure](#backend-structure)
12. [Local Setup](#local-setup)
13. [Environment Variables](#environment-variables)
14. [Deployment Guide (Railway)](#deployment-guide-railway)
15. [Demo Credentials](#demo-credentials)
16. [Tradeoffs & Future Improvements](#tradeoffs--future-improvements)
17. [Lessons Learned](#lessons-learned)

---

## Project Overview

**TaskFlow** is a team task management tool where:

- Admins create projects, invite members, and assign tasks
- Members view their assigned tasks and update statuses
- Everyone gets a dashboard showing progress at a glance

**Live Demo:** `[Your Railway URL after deployment]`

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS v4 |
| State | React Query (server state), React Context (auth) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Deployment | Railway |

---

## Problem Statement

Teams working on software, products, or any multi-person goal face a coordination problem:

> **Who is doing what? By when? Is it done?**

Without a system:
- Tasks are tracked in spreadsheets, chat messages, or people's heads
- There's no single source of truth
- Work gets duplicated or missed
- No one knows the state of the project

A task manager solves this by providing:
- A shared, persistent record of all work
- Clear ownership (tasks assigned to specific people)
- Status visibility (is it done? in progress? blocked?)
- Role boundaries (who can create/edit/delete)

---

## First Principles Thinking

### Why do we need a database?

The browser has no memory between sessions. If you store tasks in JavaScript variables, they vanish on refresh. We need a **persistent store** — something that survives server restarts, browser closes, and time.

A database is that store. It holds rows of data and answers queries reliably.

**Why relational (PostgreSQL) over document (MongoDB)?**

Our data has clear relationships:
- A task *belongs to* a project
- A project *has many* members
- A user *can be in* many projects

Relational databases are designed exactly for this. They enforce integrity — you can't create a task for a project that doesn't exist (foreign keys). MongoDB would require us to manage these relationships manually in code, which introduces bugs.

### Why do we need an API?

The frontend (browser) and backend (server) are two separate programs. They communicate over HTTP.

Why separate them? The frontend is a UI concern. The backend is a data concern. Mixing them (like server-rendered HTML) ties presentation to business logic. An API separates them cleanly:

- The frontend can be replaced (mobile app, CLI) without touching the backend
- The backend can evolve independently
- Multiple frontends can share one API

### Why JWT for authentication?

The HTTP protocol is **stateless** — each request is independent. The server doesn't remember who made the previous request.

So how does the server know "this request is from Alice, who is authenticated"?

**Option 1: Sessions**
Store a session ID in a DB. Every request looks up the session. Problems: requires shared storage (doesn't scale horizontally), DB hit on every request.

**Option 2: JWT (JSON Web Token)**
The server signs a token with a secret key. The client stores it. On every request, the client sends the token. The server verifies the signature — **no DB lookup needed**. The token itself contains the user's identity.

Why JWT wins for this project:
- Stateless (scales horizontally)
- Simple to implement
- Standard (every language/framework supports it)
- Self-contained (carries user role, ID, email)

### Why bcrypt for passwords?

Passwords must never be stored in plaintext. If the database is breached, plaintext passwords expose every user on every site they reuse the password on.

**Why not SHA-256 or MD5?**
Those are fast hashing algorithms. Fast = bad for passwords. An attacker can compute billions of guesses per second.

bcrypt is intentionally slow (the "cost factor" controls this). It also adds a random salt — so two users with the same password produce different hashes. This defeats precomputed rainbow table attacks.

### Why Prisma?

Writing raw SQL is error-prone and doesn't integrate well with TypeScript. Prisma:
1. Generates TypeScript types from your schema automatically
2. Provides a type-safe query builder — mistakes caught at compile time, not runtime
3. Handles migrations — schema changes are versioned and reproducible
4. Readable: `prisma.task.findMany({ where: { status: 'TODO' } })` reads like English

### Why Railway for deployment?

Railway provides managed infrastructure with zero infrastructure management:
- Provision a PostgreSQL database with one click
- Deploy from GitHub on push
- Environment variables managed in UI
- Free tier sufficient for demos
- Auto-SSL, custom domains available

Alternative: Render, Fly.io, Heroku. Railway was chosen for speed of setup and reliable PostgreSQL provisioning.

---

## System Design

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│   React SPA (Vite) — served from Railway static host   │
│   Stores JWT in localStorage                            │
│   Sends Authorization: Bearer <token> on every request │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS API calls
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Express API Server                   │
│   Railway Node.js service                               │
│                                                         │
│   POST /api/auth/register  → create user + JWT          │
│   POST /api/auth/login     → verify + JWT               │
│   GET  /api/projects       → list projects              │
│   POST /api/projects       → create project             │
│   GET  /api/projects/:id   → project detail + tasks     │
│   POST /api/projects/:id/tasks → create task            │
│   PUT  /api/projects/:id/tasks/:tid → update task       │
│   GET  /api/dashboard      → stats                      │
└─────────────────┬───────────────────────────────────────┘
                  │ Prisma ORM
                  ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                    │
│   Railway managed PostgreSQL                            │
│                                                         │
│   users / projects / project_members / tasks            │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture Decisions

### Backend: Layered Architecture

```
Request → Route → Middleware → Controller → Service → Database
```

**Why layers?**

Each layer has a single responsibility:

| Layer | Responsibility |
|-------|----------------|
| Route | Define URL + HTTP method, attach middleware chain |
| Middleware | Cross-cutting concerns (auth, validation) |
| Controller | Parse request, call service, send response |
| Service | Business logic — the rules of the app |
| Prisma | Database queries |

**Why thin controllers?**

If business logic lives in controllers, it becomes coupled to HTTP. You can't test it without HTTP. You can't reuse it from a CLI or cron job.

Services are pure TypeScript functions. They take data in, return data out. They're testable in isolation.

### Frontend: React Query for Server State

Why React Query instead of raw useState + useEffect for API calls?

The naive pattern:
```tsx
// Common mistake — manual fetch management
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch('/api/tasks')
    .then(r => r.json())
    .then(d => { setData(d); setLoading(false); });
}, []);
```

Problems:
- No caching — every mount refetches
- No deduplication — two components mount, two identical requests fire
- No background refresh
- Manual loading/error state management everywhere

React Query solves all of this with `useQuery`. The same query key shares data across components, automatically caches, refetches on window focus, and handles loading/error states declaratively.

---

## Database Design

### Entity Relationship

```
User ──────────────────────────────── owns ──── Project
 │                                                │
 │ (through ProjectMember)                       │
 └─── belongs to many Projects                  │
                                                 │ has many
Task ──────────────── belongs to ──────────────── Project
 │
 └─── assigned to ── User (optional)
```

### Why 4 tables?

**`users`** — Identity. Every person who can log in.

**`projects`** — Container for work. Groups tasks and team members.

**`project_members`** — The M:N bridge between users and projects.

Why not store `projectIds: string[]` on the user? Because:
- Arrays in relational DBs can't be indexed efficiently
- You can't attach metadata (role) to an array element
- Queries like "find all users in project X" become table scans

The junction table solves all of this. Each row represents one membership and can carry extra data (role, joinedAt).

**`tasks`** — The unit of work. Belongs to a project, optionally assigned to a user.

### Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // bcrypt hash
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  ownerId     String   // FK to User
}

model ProjectMember {
  userId    String
  projectId String
  role      ProjectRole  // ADMIN or MEMBER within this project
  @@unique([userId, projectId])  // prevents duplicate membership
}

model Task {
  id         String     @id @default(uuid())
  title      String
  status     TaskStatus  @default(TODO)
  priority   Priority    @default(MEDIUM)
  dueDate    DateTime?
  projectId  String      // FK to Project
  assigneeId String?     // FK to User (optional)
  creatorId  String      // FK to User
}
```

---

## Authentication Flow

```
1. User submits email + password
           │
           ▼
2. Backend looks up user by email
   → NOT FOUND? Return "Invalid email or password" (same message as wrong password)
     Why? Prevent account enumeration attacks.
           │
           ▼
3. bcrypt.compare(plaintext, hash)
   → WRONG? Return "Invalid email or password"
           │
           ▼
4. jwt.sign({ id, email, role, name }, JWT_SECRET, { expiresIn: '7d' })
   → Returns a signed token
           │
           ▼
5. Frontend stores token in localStorage
   → Sets Authorization: Bearer <token> header via Axios interceptor
           │
           ▼
6. Every subsequent request hits authenticate() middleware
   → jwt.verify(token, JWT_SECRET)
   → Attaches decoded user to req.user
   → Controller reads req.user.id, req.user.role
```

### Why 7-day expiry?

Tradeoff: shorter = more secure (stolen token expires fast), longer = better UX (less frequent login).

7 days is a standard balance for productivity apps. Not a banking app — we don't need 15-minute tokens.

For production: add refresh token rotation. Out of MVP scope.

---

## Role-Based Access Logic

Two levels of roles exist simultaneously:

### System Role (on `User` model)
- `ADMIN` — can see all projects and tasks across the system
- `MEMBER` — can only see projects they're members of

### Project Role (on `ProjectMember` model)
- `ADMIN` — can create/edit/delete tasks in this project, add/remove members
- `MEMBER` — can only update the status of tasks assigned to them

### Authorization Matrix

| Action | System Admin | Project Admin | Project Member | Non-member |
|--------|-------------|---------------|----------------|------------|
| View project | ✓ | ✓ | ✓ | ✗ |
| Create task | ✓ | ✓ | ✗ | ✗ |
| Assign task | ✓ | ✓ | ✗ | ✗ |
| Update task (any field) | ✓ | ✓ | ✗ | ✗ |
| Update task status (own) | ✓ | ✓ | ✓ (if assignee) | ✗ |
| Delete task | ✓ | ✓ | ✗ | ✗ |
| Add members | ✓ | ✓ (owner) | ✗ | ✗ |

**Why separate Authentication from Authorization?**

Authentication = "Who are you?" (handled by JWT middleware — runs on every protected route)
Authorization = "Are you allowed to do this?" (checked in service layer — specific to each operation)

Mixing them would mean: "only admins can log in" — which is wrong. Anyone can authenticate. Only some can perform sensitive operations.

---

## API Design

### Auth Routes
```
POST /api/auth/register
  Body: { email, password, name }
  Response: { user: {...}, token: "jwt..." }

POST /api/auth/login
  Body: { email, password }
  Response: { user: {...}, token: "jwt..." }

GET /api/auth/me
  Auth: Required
  Response: { user: {...} }
```

### Project Routes
```
GET    /api/projects              Auth: Required
POST   /api/projects              Auth: Required (any authenticated user)
GET    /api/projects/:id          Auth: Required + must be member
PUT    /api/projects/:id          Auth: Required + must be project owner/admin
POST   /api/projects/:id/members  Auth: Required + must be project owner/admin
DELETE /api/projects/:id/members/:userId  Auth: Required + must be project owner/admin
GET    /api/projects/users        Auth: Required (returns all users for member selection)
```

### Task Routes (nested under projects)
```
GET    /api/projects/:projectId/tasks              Auth: Required + project member
POST   /api/projects/:projectId/tasks              Auth: Required + project member
PUT    /api/projects/:projectId/tasks/:taskId      Auth: Required + role-based
DELETE /api/projects/:projectId/tasks/:taskId      Auth: Required + project admin
```

### Dashboard
```
GET /api/dashboard   Auth: Required
  Admins get: system-wide stats
  Members get: stats scoped to their projects
```

---

## Frontend Structure

```
frontend/src/
├── api/              # All API calls, one file per domain
│   ├── client.ts     # Axios instance + interceptors
│   ├── auth.ts
│   ├── projects.ts
│   ├── tasks.ts
│   └── dashboard.ts
├── components/
│   ├── ui/           # Dumb, reusable components (Button, Input, Modal, Badge, Card)
│   └── layout/       # Structural components (Sidebar, AppLayout)
├── context/
│   └── AuthContext.tsx  # Auth state + login/logout/register
├── pages/            # Route-level components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   └── ProjectDetailPage.tsx
├── routes/
│   └── ProtectedRoute.tsx  # Auth guard for React Router
├── types/
│   └── index.ts      # Shared TypeScript types (mirrors backend schema)
└── App.tsx           # Router setup + providers
```

**Why this structure?**

- `api/` is isolated — if we switch from Axios to fetch, we only change these files
- `components/ui/` components have no business logic — they're pure presentation
- `pages/` components orchestrate data fetching and business flows
- `context/` handles global state that many components need (auth)
- `types/` mirrors the backend schema — one place for shared contracts

---

## Backend Structure

```
backend/src/
├── config/
│   ├── env.ts        # Fail-fast env validation
│   └── database.ts   # Prisma client singleton
├── middleware/
│   ├── auth.ts       # JWT verification + admin guard
│   ├── validate.ts   # express-validator error collector
│   └── errorHandler.ts  # Global error handler + 404
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts    # register, login, getUser
│   │   ├── auth.controller.ts # thin HTTP handlers
│   │   └── auth.routes.ts     # route definitions + validation rules
│   ├── projects/
│   │   ├── project.service.ts
│   │   ├── project.controller.ts
│   │   └── project.routes.ts
│   ├── tasks/
│   │   ├── task.service.ts
│   │   ├── task.controller.ts
│   │   └── task.routes.ts
│   └── users/
│       ├── dashboard.service.ts
│       └── dashboard.routes.ts
├── types/
│   └── index.ts      # AuthenticatedRequest, ApiResponse
├── utils/
│   └── response.ts   # sendSuccess, sendError helpers
├── app.ts            # Express setup, middleware, route mounting
└── server.ts         # Entry point: DB connect, listen
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local or a free cloud instance like Supabase/Neon)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/charan-rathore/project-management-tool
cd project-management-tool
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string and a JWT secret
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts   # Seed demo data
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# .env should contain: VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Environment Variables

### Backend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Secret for signing JWTs — keep this strong and private | `super-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Allowed CORS origin | `https://your-frontend.railway.app` |

### Frontend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://your-backend.railway.app/api` |

**Why separate env files?**

The frontend `.env` is baked into the JavaScript bundle at build time (Vite inlines `VITE_*` vars). The backend `.env` is read at runtime by the Node.js process. They serve different purposes. Never put secrets in the frontend env — the entire bundle is publicly readable.

---

## Deployment Guide (Railway)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial implementation"
git remote add origin https://github.com/charan-rathore/project-management-tool
git push -u origin main
```

### Step 2: Create Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** plugin — Railway provisions it instantly
3. Copy the `DATABASE_URL` from the PostgreSQL service

### Step 3: Deploy Backend

1. Click **+ New Service → GitHub Repo**
2. Select the repo, set root directory to `backend/`
3. Railway auto-detects Node.js (Nixpacks)
4. Set environment variables:
   - `DATABASE_URL` → from PostgreSQL plugin
   - `JWT_SECRET` → generate a strong random string
   - `NODE_ENV` → `production`
   - `FRONTEND_URL` → (set after deploying frontend)
5. Deploy. The `railway.json` runs `prisma migrate deploy` before starting.

### Step 4: Deploy Frontend

1. Click **+ New Service → GitHub Repo**
2. Set root directory to `frontend/`
3. Set environment variable:
   - `VITE_API_URL` → `https://your-backend.railway.app/api`
4. Build command: `npm run build`
5. Deploy

### Step 5: Update CORS

In the backend Railway service, update:
- `FRONTEND_URL` → your frontend Railway URL

### Step 6: Seed the database

From the Railway CLI or the Railway dashboard terminal:
```bash
cd backend && npm run prisma:seed
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Member | bob@demo.com | member123 |
| Member | carol@demo.com | member123 |

The admin account can see all projects and perform all operations. Member accounts are restricted to assigned tasks and their own projects.

---

## Tradeoffs & Future Improvements

### What was intentionally simplified

| Feature | Decision | Why |
|---------|----------|-----|
| No refresh tokens | Single 7-day JWT | Adds complexity, not needed for demo |
| No real-time updates | Manual refresh / React Query polling | WebSockets are stateful and complex |
| No file uploads | Out of scope | Requires S3/CDN integration |
| No email verification | Demo app | Adds SMTP dependency |
| No pagination | Small data sets in demo | Add cursor-based pagination for production |
| No tests | Time-constrained assignment | Would add Jest + Supertest for backend |

### What I'd add for production

1. **Refresh token rotation** — Short-lived access tokens (15min) + long-lived refresh tokens
2. **Email verification** — Prevent fake accounts
3. **Pagination + filtering** — For large task lists
4. **Audit log** — Track who changed what
5. **Notifications** — Email/in-app alerts for assigned tasks and due dates
6. **Docker Compose** — For reproducible local development
7. **Unit + integration tests** — Jest (backend), Vitest (frontend)
8. **Rate limiting** — Prevent brute-force on auth endpoints
9. **HTTPS-only cookies** — More secure than localStorage for tokens

---

## Lessons Learned

**1. Schema design is the most important decision.**
Every feature and query flows from the data model. Getting User → ProjectMember → Project → Task relationships right upfront prevented major refactors.

**2. Layered architecture pays off quickly.**
Thin controllers made adding authorization logic to services trivial. No business logic was duplicated across route handlers.

**3. TypeScript across the stack catches bugs before they ship.**
The same type errors that Prisma generates on the backend are reflected in the frontend types. Mismatches are caught at compile time.

**4. React Query eliminates 80% of data-fetching boilerplate.**
No manual loading states, no useEffect dependency arrays, no cache invalidation bugs — React Query handles all of it.

**5. Railway is genuinely easy.**
Zero infrastructure work. The biggest deployment challenge was getting environment variables right, not the infrastructure.

---

*Built by Charan Rathore as a hiring assignment demonstrating full-stack TypeScript architecture.*
