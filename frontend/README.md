# 🎨 Frontend Application — Judy Marketplace

A highly interactive, role-based dashboard for the Judy Marketplace workflow challenge, built with Next.js, Tailwind CSS, and Framer Motion. This application provides distinct internal views for **Admins**, **Buyers**, and **Problem Solvers**, utilizing smooth, state-driven animations to represent the project lifecycle.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js v16** (App Router) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** |
| Animations | **Framer Motion** (`motion/react`) |
| Icons | **Lucide React** |
| State/Auth | **React Context API** (`AuthContext`) |
| Data Fetching | Native `fetch` with JWT Authorization |

---

## ✨ Key Features & UI/UX

### 🔐 1. Role-Bound Dashboards
The application dynamically routes users to completely different interfaces based on their JWT role:
* **🛡️ Admin Dashboard (`/dashboard/admin`)**: 
  * Tabbed layout to view *Applications*, *Users*, and *Projects*.
  * Ability to view solver requests and promote users directly to the **Buyer** role with a confirmation modal.
  * Real-time metrics/stats on user roles and project statuses across the platform.
* **🛒 Buyer Dashboard (`/dashboard/buyer`)**: 
  * Create new projects with rich descriptions.
  * Monitor the unassigned, assigned, and completed states of all owned projects.
  * Dedicated single-project view to review incoming solver requests, assign the project, and accept/reject ZIP deliveries.
* **🔧 Solver Dashboard (`/dashboard/solver`)**: 
  * Profile management.
  * Browse the global marketplace of `Unassigned` projects.
  * Create sub-tasks for assigned projects with custom timelines.
  * Upload `.zip` delivery files directly via FormData.

### 🎬 2. Animated Workflow Lifecycle
The prompt required that animations explain the system state rather than just decorate it. This is implemented via Framer Motion:
* **Micro-interactions:** Hover effects, tap scaling (`whileTap`), and glowing borders on interactive elements.
* **State Morphing:** When a project transitions from `Unassigned` → `Assigned` (or a task from `In-progress` → `Submitted`), dynamic badges swap smoothly.
* **List Animations:** Entering/exiting items (like rejecting an application or assigning a solver) use `<AnimatePresence>` to slide in/out gracefully rather than jarring hard-reloads.
* **Animated Landing Page:** A custom-built, vibrant landing page with floating particles, glowing gradient orbs, and a bidirectional animated testimonial carousel utilizing `popLayout`.

### 🚨 3. Toast Notification System
A global, animated Toast notification component provides instant, non-blocking feedback for *every* API interaction (`success` / `error`), ensuring users aren't left guessing if a background request succeeded.

---

## 📂 Project Structure

```text
frontend/
├── app/
│   ├── dashboard/
│   │   ├── admin/      # Admin global overview & user management
│   │   ├── buyer/      # Buyer project creation & task review
│   │   └── solver/     # Solver marketplace & ZIP delivery
│   ├── context/
│   │   └── AuthContext.tsx  # Global JWT state & user persistence bounds
│   ├── login/
│   ├── register/
│   ├── globals.css     # Global theme variables, gradients, scrollbars
│   ├── layout.tsx      # Root layout wrapped in AuthProvider
│   └── page.tsx        # Animated Landing Page & Call to Action
├── postcss.config.mjs
└── tailwind.config.ts  # V4 config integrated within postcss/css
```

---

## 🛠️ Setup & Local Development

### Prerequisites
- Node.js or [Bun](https://bun.sh/)
- The **Backend API** must be running locally on `http://localhost:5000`

### Installation

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
bun install

# 3. Start the development server
bun run dev
```

The application will start on `http://localhost:3000`.

### Environment Variables
By default, the app looks for the backend at `http://localhost:5000`. You can override this by creating a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🔒 Security Flow

1. **Frontend Isolation:** The frontend holds **zero** inherent trust. It relies entirely on the HTTP status codes and payloads returned by the backend.
2. **Context Persistence:** On load, `AuthContext` verifies the stored token via `/api/auth/me`. If invalid, the user is purged and routed to `/login`.
3. **Route Guards:** If a `Problem Solver` attempts to manually navigate to `/dashboard/admin`, the `AuthContext` intercepts the mismatch and boots them back to their rightful dashboard.
