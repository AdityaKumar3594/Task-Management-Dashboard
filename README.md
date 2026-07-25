# Indian Navy Department Task Management Dashboard

A department-wise task management system for the Indian Navy. Track tasks across departments with status indicators for **Completed**, **Ongoing**, and **Overdue**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4 |
| State / Data | TanStack Query v5, Axios |
| Charts | Recharts v3 |
| Backend | Node.js, Express 4, TypeScript |
| Database | MongoDB (Mongoose 8) |
| Validation | Zod (backend & frontend) |
| Auth | JWT (7-day tokens), bcryptjs |

---

## Project Structure

```
Task-Management-Dashboard/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT authenticate, requireAdmin, canAccessDepartment
│   │   │   └── validate.ts       # Zod-based body/query validators
│   │   ├── models/
│   │   │   ├── Department.ts     # name, code, description, isActive
│   │   │   ├── Task.ts           # title, dept, priority, dueDate, status
│   │   │   └── User.ts           # name, email, passwordHash, role, departmentId
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login, me, list/create users
│   │   │   ├── dashboard.ts      # Summary + per-department stats
│   │   │   ├── departments.ts    # Department CRUD
│   │   │   └── tasks.ts          # Task CRUD + complete action
│   │   ├── types/index.ts        # Shared TS types + Express augmentation
│   │   └── utils/
│   │       ├── jwt.ts            # signToken, verifyToken
│   │       ├── seed.ts           # Database seeder script
│   │       └── taskStatus.ts     # getDisplayStatus, countByDisplayStatus
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance + 401 redirect interceptor
│   │   │   └── index.ts          # authApi, tasksApi, departmentsApi, dashboardApi
│   │   ├── components/
│   │   │   ├── DeptCard.tsx      # Department stat card with progress bar
│   │   │   ├── Layout.tsx        # Sidebar shell with role-aware nav
│   │   │   ├── Modal.tsx         # Reusable overlay modal
│   │   │   ├── ProtectedRoute.tsx # Auth guard + AdminRoute guard
│   │   │   ├── StatusBadge.tsx   # Colored pill for completed/ongoing/overdue
│   │   │   ├── SummaryCards.tsx  # Four KPI cards (total/done/ongoing/overdue)
│   │   │   └── TaskForm.tsx      # Create/edit task form
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth state, login, logout, isAdmin
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx # KPI cards + bar chart + dept grid
│   │   │   ├── DepartmentsPage.tsx # Admin: list + create/edit/deactivate depts
│   │   │   ├── LoginPage.tsx     # Split-screen login
│   │   │   ├── TasksPage.tsx     # Task table with filters + CRUD actions
│   │   │   └── UsersPage.tsx     # Admin: list + create users
│   │   ├── types/index.ts        # Frontend types mirroring backend
│   │   ├── App.tsx               # Router, providers, route definitions
│   │   └── main.tsx              # React root
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas connection string

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env        # then edit .env with your values
npm install
npm run seed                # wipes DB and creates sample data (see below)
npm run dev                 # API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # set VITE_API_URL if not using defaults
npm install
npm run dev                 # UI on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | Secret used to sign JWT tokens |
| `PORT` | `5000` | Port the API listens on |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin (frontend URL) |

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
- **9 tasks** — spread across departments with varied priorities, due dates, and statuses (some intentionally overdue)

### Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@navy.in | admin123 |
| Dept User (Ops) | officer1@navy.in | dept123 |
| Dept User (Logistics) | officer2@navy.in | dept123 |
| Dept User (Engineering) | officer3@navy.in | dept123 |

---

## Features

### All Users
- **Login** — JWT-based authentication with persistent session via `localStorage`
- **Dashboard** — Four KPI cards (total, completed, ongoing, overdue), a grouped bar chart by department, and per-department stat cards with completion progress bars
- **Tasks** — Filter by department, status, and priority; create new tasks; mark tasks as complete; edit and delete tasks

### Admin Only
- **Departments** — Create departments (name + code + description), edit existing ones, soft-deactivate departments
- **Users** — View all users, create new department users with role and department assignment

### Role-Based Access
- Department users automatically see only tasks belonging to their own department
- Admin/Users and Departments pages are hidden and route-guarded for non-admins
- JWT is validated on every request; expired or invalid tokens redirect to login

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login, returns JWT + user |
| GET | `/api/auth/me` | User | Current authenticated user |
| GET | `/api/auth/users` | Admin | List all users |
| POST | `/api/auth/users` | Admin | Create a new user |

### Departments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/departments` | User | List all active departments |
| POST | `/api/departments` | Admin | Create a department |
| PUT | `/api/departments/:id` | Admin | Update a department |
| DELETE | `/api/departments/:id` | Admin | Soft-deactivate a department |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | User | List tasks (dept users see only their dept) |
| POST | `/api/tasks` | User | Create a task |
| PUT | `/api/tasks/:id` | User | Update a task |
| PATCH | `/api/tasks/:id/complete` | User | Mark a task as completed |
| DELETE | `/api/tasks/:id` | User | Delete a task (permanent) |

Query params for `GET /api/tasks`: `departmentId`, `status` (`ongoing` | `completed` | `overdue`), `priority` (`low` | `medium` | `high`)

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | User | Global task counts |
| GET | `/api/dashboard/by-department` | User | Per-department breakdown with completion rate |

---

## Task Status Logic

Status is computed at query time — it is never stored as `overdue` in the database.

| Display Status | Rule |
|---|---|
| `completed` | Task `status` field is `completed` |
| `overdue` | Not completed **and** `dueDate` is before today (day-level comparison) |
| `ongoing` | Not completed **and** `dueDate` is today, in the future, or absent |

---

## Data Model Notes

- **Tasks** are assigned to **departments**, not individual users. `assignedBy` records who created the task.
- **Department delete** is a soft-delete (`isActive = false`). Tasks belonging to a deactivated department are not removed.
- **Users**: `admin` role must not have a `departmentId`; `department_user` role requires one.

---

## Known Limitations

These are current trade-offs or out-of-scope items, not bugs:

- **No pagination** — All task/user lists are returned in full. Performance will degrade with large datasets.
- **No user edit or deactivate** — The Users page supports creating users only. Changing name, email, password, role, or department, and deactivating users, is not implemented.
- **Dashboard shows global stats for all roles** — Department users see the organisation-wide summary rather than their own department's stats.
- **In-memory dashboard aggregation** — The by-department endpoint groups data in JavaScript rather than via a MongoDB aggregation pipeline. Not suitable for high-volume data.
- **No department reactivation UI** — The `PUT /departments/:id` endpoint accepts `isActive`, but the edit form in the UI does not expose a toggle to reactivate a soft-deleted department.
- **No search or column sorting on tasks** — The task table supports status/priority/dept filters but not free-text search or sort-by-column.
- **No security hardening** — No rate limiting on auth routes, no HTTP security headers (Helmet), and no HTTPS setup. Not production-ready as-is.
- **Demo credentials visible in UI** — `LoginPage` shows the default credentials as a visible hint. Remove before deploying to any shared environment.

---

## Possible Improvements

- Add pagination (`limit` / `offset`) to task and user list endpoints
- Add a user edit flow (name, email, password reset, role/department change) and soft-deactivation
- Filter dashboard stats by role so department users see only their own department
- Replace in-memory dashboard grouping with MongoDB aggregation pipelines
- Add Helmet, express-rate-limit, and HTTPS termination for production hardening
- Add a re-activate toggle to the Departments page
- Add task search and sortable table columns
- Add task assignment to individual users (`assignedTo` field)
