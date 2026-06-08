# Student Attendance Management System

Full-stack university attendance management application built with React, Express, TypeScript, TailwindCSS, Drizzle ORM, and NeonDB.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Framer Motion, TanStack Query, Zustand
- **Backend:** Express, TypeScript, Drizzle ORM, JWT auth
- **Database:** NeonDB (PostgreSQL)

## Prerequisites

- Node.js 18+
- NeonDB account with connection string
- (Optional) Cloudinary for profile photos
- (Optional) Resend for email notifications

## Setup

1. Clone the repository and install dependencies:

```bash
cd client && npm install
cd ../server && npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets
```

3. Run database migrations and seed:

```bash
cd server
npm run db:push    # or db:migrate after generate
npm run db:seed
```

4. Start development servers:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5005/api

## Demo Credentials (after seed)

| Role    | Email                   | Password  |
|---------|-------------------------|-----------|
| Admin       | admin@admin.com           | admin     |
| CR (8E)     | cr8e@gmail.com            | cr8e      |
| CR (8A)     | cr8a@gmail.com            | cr8a      |
| CR (7B)     | cr7b@gmail.com            | cr7b      |
| CR shortcut | cr8e, teacher, or cr      | cr8e      |
| Student     | 11220321018@gmail.com     | 11220321018 |
| Student     | student (email shortcut)  | 11220321018 |
| Student     | 11220321018 (ID only)     | 11220321018 |

All seeded students: **email** = `{studentId}@gmail.com`, **password** = their student ID.

**CR accounts** (48 total: semesters 1–8 × sections A–F): `cr{semester}{section}@gmail.com` / password `cr{semester}{section}` (e.g. `cr8e@gmail.com` / `cr8e`). Each CR can only manage their own semester + section.

## Scripts

### Server
- `npm run dev` — Start dev server with hot reload
- `npm run build` — Compile TypeScript
- `npm run db:generate` — Generate migrations
- `npm run db:migrate` — Run migrations
- `npm run db:seed` — Seed demo data

### Client
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build

## Deployment

- **Client:** Deploy to Vercel with `VITE_API_URL` set to production API
- **Server:** Deploy to Railway/Render with all env vars configured
- Set cookie `secure: true` and `sameSite: none` in production
