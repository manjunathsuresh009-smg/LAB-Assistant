# CampusLab AI

CampusLab AI is a full-stack, explainable GenAI platform for sharing laboratory resources across campus departments. It combines equipment discovery, project-aware AI recommendations, conflict-aware faculty approvals, and live utilisation analytics.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, React Router
- Backend: Node.js, Express, TypeScript, Prisma, SQLite
- AI: Gemini API with a deterministic labelled fallback when no API key is configured
- Auth: JWT + bcrypt, role-based access control (STUDENT, FACULTY, ADMIN)

## Features

- Role-based dashboards and protected routes
- Equipment catalogue with search, filters, department ownership, and availability
- Booking workflow with duration, deadline, capacity, and duplicate validation
- AI equipment recommendations with explainable score breakdowns
- Conflict resolver that ranks overlapping pending requests using a transparent priority model
- Faculty approval/rejection with capacity re-validation
- Admin equipment and department management
- Live analytics: dashboard KPIs, department utilisation, monthly trends, underutilised resources
- Automatic demo seeding for an immediately runnable hackathon demo

## Priority model

Scores are normalised to `0-100`:

- `35%` deadline urgency
- `25%` equipment compatibility
- `20%` availability feasibility
- `20%` fairness

The Conflict Resolver explains the leading factor for every ranked request and recommends an approval or deferral. Faculty approval is always required.

## Quick start

### Backend

```bash
cd backend
npm install
npm run db:push
npm run seed
npm run dev
```

API: `http://localhost:4000/api`
Health: `http://localhost:4000/api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

### Production build

```bash
cd frontend && npm run build
cd ../backend && npm run build && npm start
```

The backend serves the built frontend from `frontend/dist` when `SERVE_FRONTEND` is not disabled.

## Demo accounts

- Student: `student.asha@campuslab.ai` / `Student@123`
- Faculty: `faculty.ece@campuslab.ai` / `Faculty@123`
- Admin: `admin@campuslab.ai` / `Admin@123`

The seed includes a contested GPU Workstation scenario for the Conflict Resolver.

## AI configuration

Set `GEMINI_API_KEY` in `backend/.env` to enable live Gemini responses. If it is empty, the platform uses its deterministic labelled fallback so demos work offline.

## Tests

```bash
cd backend
npm run typecheck
npm test
```

```bash
cd frontend
npm run typecheck
npm run build
```

## Docker / Cloud Run

```bash
docker build -t campuslab-ai .
docker run -p 8080:8080 -e JWT_SECRET=change-me campuslab-ai
```

Set `JWT_SECRET` and optionally `GEMINI_API_KEY` in the deployment environment. The database auto-seeds on first start when it is empty.

## Repository notes

- No `node_modules`, build output, local database files, or secrets are committed.
- The application is designed to stay well under the 10 MB repository limit.
