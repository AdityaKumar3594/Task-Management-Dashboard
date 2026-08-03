# Indian Navy Department Task Management Dashboard

A full-stack, mobile-responsive task management system for the Indian Navy. Track, assign, and manage tasks across departments with real-time status indicators for **Completed**, **Ongoing**, and **Overdue**.

🔗 **Live Demo:** [task-management-dashboard-six-silk.vercel.app](https://task-management-dashboard-six-silk.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4 |
| State / Data | TanStack Query v5, Axios |
| Charts | Recharts v3 |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB Atlas (Mongoose 8) |
| Validation | Zod (backend & frontend) |
| Auth | JWT (7-day tokens), bcryptjs |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Features

### All Users
- **Login** — JWT authentication with persistent session
- **Dashboard** — KPI cards, grouped bar chart, per-department stat cards with progress bars and overdue warnings. Dept users see only their own department's data
- **Tasks** — Full CRUD with filters (department, status, priority), free-text search, and a "My Tasks" toggle
- **Task assignment** — Assign tasks to individual users via a searchable dropdown (filters by department)
- **Due soon warnings** — Amber highlight on tasks due within 3 days
- **Change Password** — Every user can change their own password from the sidebar

### Admin Only
- **Departments** — Create, edit, soft-deactivate, and reactivate departments
- **Users** — Create, edit (name, email, role, department), reset passwords, and delete users
- **Role-based access** — Admin and Department User roles with route guards and scoped data visibility

### UX
- Fully responsive — hamburger nav, card views on mobile, bottom-sheet modals
- Skeleton loaders on Dashboard and Users page
- Render cold-start banner (server wake-up indicator)
- Empty states with contextual messages and clear-filter actions
- Completed tasks show "Reopen" instead of "Edit"
- Mutation loading states — buttons disable during in-flight requests

---

## Project Structure

```
Task-Management-Dashboard/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app + security middleware
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT authenticate, requireAdmin, canAccessDepartment
│   │   │   └── validate.ts       # Zod body/query validators
│   │   ├── models/
│   │   │   ├── Department.ts     # name, code, description, isActive
│   │   │   ├── Task.ts           # title, dept, assignedTo, priority, dueDate, status
│   │   │   └── User.ts           # name, email, passwordHash, role, departmentId
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login, me, CRUD users, password management
│   │   │   ├── dashboard.ts      # Role-scoped summary + per-department stats
│   │   │   ├── departments.ts    # Department CRUD
│   │   │   └── tasks.ts          # Task CRUD + complete + dept-user lookup
│   │   ├── types/index.ts
│   │   └── utils/
│   │       ├── jwt.ts
│   │       ├── seed.ts
│   │       └── taskStatus.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance + 401 interceptor
│   │   │   └── index.ts          # authApi, tasksApi, departmentsApi, dashboardApi
│   │   ├── components/
│   │   │   ├── ApiWarmup.tsx     # Render cold-start banner
│   │   │   ├── ChangePasswordModal.tsx
│   │   │   ├── DeptCard.tsx      # Dept stat card with overdue indicator
│   │   │   ├── Layout.tsx        # Sidebar + mobile hamburger nav
│   │   │   ├── Modal.tsx         # Bottom-sheet on mobile, centered on desktop
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── TaskForm.tsx      # Create/edit task with assignee search
│   │   │   └── UserSearchSelect.tsx  # Searchable user dropdown
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DepartmentsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   └── UsersPage.tsx
│   │   ├── types/index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── navy-logo.svg         # Indian Navy emblem (logo + favicon)
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json               # SPA rewrites + cache headers
│   └── vite.config.ts
│
└── README.md
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas connection string

---

## Local Setup

### 1. Backend

```bash
cd backend
cp .env.example .env        # fill in your values
npm install
npm run seed                # wipes DB and inserts sample data
npm run dev                 # API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # set VITE_API_URL if needed
npm install
npm run dev                 # UI on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | Secret for signing JWT tokens — use a long random string in production |
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | Set to `production` on Render |
| `ADMIN_EMAIL` | `admin@navy.in` | Seed script admin email |
| `ADMIN_PASSWORD` | `admin123` | Seed script admin password |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |

---

## Seed Data

Running `npm run seed` in the backend **wipes all existing data** and inserts:

- **1 admin user**
- **5 departments** — Operations, Logistics, Engineering, Medical, Administration
- **3 department users** — one each for Operations, Logistics, Engineering
- **9 tasks** — varied priorities, due dates, and statuses (some intentionally overdue)

> ⚠️ The seed script will not run if `NODE_ENV=production` to prevent accidental data loss.

### Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@navy.in | admin123 |
| Dept User (Ops) | officer1@navy.in | dept123 |
| Dept User (Logistics) | officer2@navy.in | dept123 |
| Dept User (Engineering) | officer3@navy.in | dept123 |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login, returns JWT + user |
| GET | `/api/auth/me` | User | Current authenticated user |
| GET | `/api/auth/users` | Admin | List all users |
| POST | `/api/auth/users` | Admin | Create a user |
| PUT | `/api/auth/users/:id` | Admin | Edit user (name, email, role, department) |
| DELETE | `/api/auth/users/:id` | Admin | Delete a user |
| PATCH | `/api/auth/change-password` | User | Change own password |
| PATCH | `/api/auth/users/:id/reset-password` | Admin | Reset any user's password |

### Departments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/departments` | User | List all departments |
| POST | `/api/departments` | Admin | Create a department |
| PUT | `/api/departments/:id` | Admin | Update / reactivate a department |
| DELETE | `/api/departments/:id` | Admin | Soft-deactivate a department |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | User | List tasks (dept users scoped to their dept) |
| GET | `/api/tasks/department-users/:deptId` | User | Users in a department (for assignee dropdown) |
| POST | `/api/tasks` | User | Create a task |
| PUT | `/api/tasks/:id` | User | Update a task |
| PATCH | `/api/tasks/:id/complete` | User | Mark as completed |
| DELETE | `/api/tasks/:id` | User | Delete a task (permanent) |

**Query params for `GET /api/tasks`:** `departmentId`, `status` (`ongoing` | `completed` | `overdue`), `priority` (`low` | `medium` | `high`)

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | User | Task counts (scoped by role) |
| GET | `/api/dashboard/by-department` | User | Per-department breakdown (scoped by role) |

---

## Task Status Logic

Status is computed at query time — `overdue` is never stored in the database.

| Display Status | Rule |
|---|---|
| `completed` | Task `status` field is `completed` |
| `overdue` | Not completed **and** `dueDate` is before today |
| `ongoing` | Not completed **and** `dueDate` is today, future, or absent |

---

## Security

- Helmet sets HTTP security headers on every response
- Rate limiting on `POST /api/auth/login` — 20 requests per 15 minutes per IP
- `express-mongo-sanitize` strips `$` and `.` from inputs to prevent NoSQL injection
- Request body capped at 10KB
- Stack traces are hidden in `NODE_ENV=production`
- CORS restricted to `CLIENT_URL` origin

---

## Deployment

### Render (Backend)

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

**Required environment variables on Render:**
`NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`

### Vercel (Frontend)

**Required environment variable on Vercel:**
`VITE_API_URL=https://your-render-url.onrender.com/api`

> Vercel bakes env vars at build time — redeploy after changing them.

---

## Data Model Notes

- Tasks are assigned to a **department** and optionally to an **individual user** (`assignedTo`)
- `assignedBy` records who created the task
- Department delete is a **soft-delete** (`isActive = false`) — tasks are preserved
- Dashboard stats are **role-scoped** — dept users see only their own department

---

## Known Limitations

- **No pagination** — all lists load in full; performance will degrade with large datasets
- **No email notifications** — users are not notified when a task is assigned to them
- **No task comments or activity log** — no history of edits or status changes
- **No file attachments** on tasks
- **In-memory dashboard aggregation** — groups data in JavaScript, not MongoDB pipelines
- **Password change does not invalidate other sessions** — existing tokens remain valid until expiry (7 days)
