# Backend API

A role-based project marketplace REST API built with Node.js, Express, and MongoDB. It powers a workflow where Admins manage access, Buyers post projects, and Problem Solvers bid on and complete them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Framework | Express.js v5 |
| Language | TypeScript |
| Database | MongoDB via Mongoose v9 |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| File Upload | Multer (local filesystem) |

---

## Project Structure

```
src/
├── config/
│   └── db.ts                  # MongoDB connection
├── controllers/
│   ├── authController.ts      # Register, login, getMe
│   ├── userController.ts      # Admin: list users, assign role
│   ├── projectController.ts   # Buyer: create/view projects, assign solver
│   └── solverController.ts    # Solver: request work, create tasks, submit ZIP
├── middlewares/
│   ├── authMiddleware.ts      # JWT protect + role authorize guards
│   └── uploadMiddleware.ts    # Multer ZIP-only file upload
├── models/
│   ├── User.ts                # name, email, password (hashed), role
│   ├── Project.ts             # title, description, buyerId, solverId, status
│   ├── Request.ts             # projectId, solverId, status
│   ├── Task.ts                # projectId, solverId, title, description, timeline, status
│   └── Submission.ts          # taskId, solverId, fileUrl, fileName
└── routes/
    ├── authRoutes.ts
    ├── userRoutes.ts
    ├── projectRoutes.ts
    └── solverRoutes.ts
```

---

## Setup & Installation

### Prerequisites
- [Bun](https://bun.sh) v1.3+
- MongoDB (local or [Atlas](https://cloud.mongodb.com) free tier)

### Steps

```bash
# 1. Install dependencies
bun install

# 2. Create environment file
cp .env.example .env
# Fill in your MONGO_URI and JWT_SECRET

# 3. Start development server (with hot reload)
bun run dev
```

### Environment Variables (`.env`)

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net
JWT_SECRET=your_super_secret_key
PORT=5000
NODE_ENV=development
```

---

## Role Hierarchy

```
Admin
 └── Can view all users
 └── Can promote any user to the Buyer role

Buyer
 └── Creates projects (status starts as Unassigned)
 └── Reviews incoming solver requests
 └── Assigns exactly one solver (all others auto-rejected)
 └── Accepts or rejects submitted task work

Problem Solver
 └── Browses all available (Unassigned) projects
 └── Submits a request to work on a project
 └── Once assigned: creates tasks with title, description, deadline
 └── Uploads a ZIP file per completed task
```

---

## Project Lifecycle

```
[Buyer creates project]
        │
        ▼
  ┌─────────────┐
  │ UNASSIGNED  │  ← Solvers can request to work
  └──────┬──────┘
         │ Buyer assigns a solver
         ▼
  ┌─────────────┐
  │  ASSIGNED   │  ← Solver creates tasks, uploads ZIPs
  └──────┬──────┘
         │ Buyer accepts all tasks
         ▼
  ┌─────────────┐
  │  COMPLETED  │
  └─────────────┘

Task Lifecycle:
  IN-PROGRESS → SUBMITTED → COMPLETED
                          ↘ REJECTED (Buyer rejects, solver can re-submit)
```

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <jwt_token>
```

### Auth (`/api/auth`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user. Default role: `Problem Solver` |
| POST | `/api/auth/login` | Public | Login. Returns a JWT token |
| GET | `/api/auth/me` | Any logged-in user | Returns the current user's profile |

**Register / Login body:**
```json
{ "name": "John", "email": "john@example.com", "password": "123456", "role": "Buyer" }
```

---

### Users (`/api/users`) — Admin only

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/users` | Admin | Get all registered users |
| PATCH | `/api/users/:id/role` | Admin | Set a user's role to `Buyer` |

**Update role body:**
```json
{ "role": "Buyer" }
```

> ⚠️ Admin can only assign the `Buyer` role. Escalating to `Admin` is blocked.

---

### Projects (`/api/projects`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/projects` | Buyer | Create a new project |
| GET | `/api/projects` | All | Browse all projects |
| GET | `/api/projects/:id` | All | Get a single project's details |
| GET | `/api/projects/:id/requests` | Buyer (owner) | View all solver requests for this project |
| PATCH | `/api/projects/:id/assign` | Buyer (owner) | Accept a request → assigns solver, rejects all others |

**Create project body:**
```json
{ "title": "Build a Dashboard", "description": "A React analytics dashboard" }
```

**Assign solver body:**
```json
{ "requestId": "<request_document_id>" }
```

---

### Solver & Tasks (`/api/projects/:id/...` and `/api/tasks/:id/...`)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/projects/:id/requests` | Problem Solver | Request to work on a project |
| POST | `/api/projects/:id/tasks` | Assigned Solver | Create a sub-task for the project |
| GET | `/api/projects/:id/tasks` | All | List all tasks for a project |
| POST | `/api/tasks/:id/submit` | Assigned Solver | Upload a ZIP file to submit a task |
| PATCH | `/api/tasks/:id/review` | Buyer (owner) | Accept or reject a submitted task |

**Create task body:**
```json
{
  "title": "Build Login Page",
  "description": "Implement JWT-based login with validation",
  "timeline": "2026-03-15"
}
```

**Submit task:**
- Method: `POST` with `multipart/form-data`
- Field name: `file`
- Accepted: `.zip` files only, max **50MB**

**Review submission body:**
```json
{ "action": "accept" }
// or
{ "action": "reject" }
```

---

### File Access

Uploaded ZIP files are served statically:
```
GET http://localhost:5000/uploads/submissions/<filename>.zip
```

---

## Data Models

### User
```
name: String (required)
email: String (unique, required)
password: String (bcrypt hashed, hidden from responses)
role: "Admin" | "Buyer" | "Problem Solver"
```

### Project
```
title: String
description: String
buyerId: ObjectId → User
solverId: ObjectId → User (null until assigned)
status: "Unassigned" | "Assigned" | "Completed"
```

### Request
```
projectId: ObjectId → Project
solverId: ObjectId → User
status: "Pending" | "Accepted" | "Rejected"
[unique index on projectId + solverId — one request per solver per project]
```

### Task
```
projectId: ObjectId → Project
solverId: ObjectId → User
title: String
description: String
timeline: Date (deadline)
status: "In-progress" | "Submitted" | "Completed" | "Rejected"
```

### Submission
```
taskId: ObjectId → Task
solverId: ObjectId → User
fileUrl: String (local path)
fileName: String (original filename)
submittedAt: Date
```

---

## Key Architectural Decisions

1. **Stateless JWT auth** — No session storage on the server. Every request is independently verified by decoding the JWT. Roles are embedded in the token for fast access without a DB lookup on every request.
2. **Role verification is backend-only** — No business logic on the frontend. All role checks happen in `authMiddleware.ts` before any controller is reached.
3. **Single-solver enforcement** — When a Buyer assigns a solver, all other `Pending` requests for that project are automatically set to `Rejected` in one MongoDB `updateMany` call.
4. **ZIP-only upload** — Multer validates both the file extension (`.zip`) and the MIME type before accepting the file, preventing simple filename spoofing.
5. **Static file serving** — Uploaded files are served via `express.static` at `/uploads/`. In a production environment, this path would be swapped for an S3/CDN URL.
