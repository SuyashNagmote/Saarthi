# Saarthi — Enterprise Performance Management Platform

> **Goals, perfectly aligned.**  
> Replacing fragmented spreadsheets and disconnected review systems with a secure, analytics-driven, AI-assisted platform — built for real enterprise workflows.

🔗 **Live Demo**
- Frontend: [saarthi-frontend-self.vercel.app](https://saarthi-frontend-self.vercel.app)
- Backend API: [saarthi-backend-snowy.vercel.app/health](https://saarthi-backend-snowy.vercel.app/health)

---

## 🧩 The Problem

Most organizations track employee performance through spreadsheets, email threads, and disconnected tools. This leads to:
- Goals set once and forgotten
- No visibility into quarterly progress
- Manual, error-prone approval workflows
- Zero data-driven insights for managers

**Saarthi solves this end-to-end** — from goal creation to annual review, with AI-backed risk detection and a 0.14% top-performer selection engine (10 out of 7,000).

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎯 SMART Goal Engine | AI validates goals against Specific, Measurable, Achievable, Relevant, Time-bound criteria |
| ✅ Approval Workflow | Manager queue with edit, approve, reject, rework — fully versioned |
| 📅 Quarterly Check-ins | Progress submissions per quarter with risk auto-flagging |
| 📊 Analytics Dashboard | Heatmaps, trends, distribution charts, peer comparison |
| 🔐 Azure AD SSO | MSAL v3 + JWT + RBAC — enterprise-grade auth out of the box |
| 🤖 Attrition Detection | Multi-factor risk scoring to flag at-risk employees early |

---

## 🏗️ Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║              SAARTHI PERFORMANCE MANAGEMENT PLATFORM            ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────── CLIENT LAYER ───────────────────────────────┐
│  Next.js :3000 (Dashboard)     Vite :5173 (Guided Tool)        │
│  · MSAL v3 Auth                · WebSocket real-time           │
│  · Role-based UI               · Lightweight UX                │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTPS / JWT Cookie
┌────────────────────────▼───────────────────────────────────────┐
│                 AUTH & SECURITY LAYER                          │
│  Azure AD (MSAL) ──► /api/v1/auth/azure                       │
│  Groups → Role Map:  Saarthi-Admins    → ADMIN                │
│                      Saarthi-Managers  → MANAGER              │
│                      Saarthi-Employees → EMPLOYEE             │
│  JWT: Access (15min) + Refresh (7d) → httpOnly cookie         │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────┐
│              EXPRESS.JS API GATEWAY                            │
│  Middleware: CORS → JSON → CookieParser → JWT Guard            │
│                                                                │
│  /api/v1/                                                      │
│  ├── /auth        · /goals      · /approvals                  │
│  ├── /checkins    · /cycles     · /dashboard                  │
│  ├── /reports     · /ai         · /analytics                  │
│  ├── /audit       · /notifications · /escalation              │
└──────┬───────────┬──────────────┬──────────────────────────────┘
       │           │              │
┌──────▼────┐ ┌───▼──────┐ ┌────▼──────────────────────────────┐
│  SCORING  │ │    AI    │ │         BUSINESS MODULES           │
│  SERVICE  │ │ SERVICE  │ │                                    │
│           │ │          │ │  Goals      Approvals   Check-ins  │
│ weighted  │ │  SMART   │ │  DRAFT  →  PENDING  →  Q1-Q4     │
│ _score =  │ │  score   │ │  SUBMITTED  APPROVED   progress   │
│ achieve%  │ │  (S/M/A  │ │  APPROVED   REJECTED   notes      │
│ × weight  │ │  /R/T)   │ │  LOCKED     REWORK     status     │
│           │ │          │ │  CLOSED                           │
│ ≥100% → 5 │ │  Risk    │ │                                    │
│ ≥90%  → 4 │ │  flags:  │ │  Attrition  Audit      Notify    │
│ ≥80%  → 3 │ │  <80% @  │ │  LOW/MED    every      email     │
│ ≥50%  → 2 │ │  halfway │ │  HIGH/CRIT  action     in-app    │
│ else  → 1 │ │  missed  │ │                                   │
└──────┬────┘ └───┬──────┘ └────┬──────────────────────────────┘
       │           │              │
┌──────▼───────────▼──────────────▼──────────────────────────────┐
│                   PostgreSQL + Prisma ORM                      │
│  users → goals → approvals → check_ins → audit_logs           │
│  Indexes: employee_id, cycle_id, status, manager_id           │
└────────────────────────────────────────────────────────────────┘

```

---

## 📊 Performance Lifecycle

```
Goal Creation → Manager Review → Approval/Rework → Goal Locking
      → Quarterly Check-ins → Scoring → Risk Detection → Annual Review
```

---

## 🔐 Role-Based Access

| Capability | Employee | Manager | Admin |
|---|:---:|:---:|:---:|
| Create / Edit Goals | ✅ | ✅ | ✅ |
| Approve Goals | ❌ | ✅ | ✅ |
| View Team Analytics | ❌ | ✅ | ✅ |
| Org-wide Visibility | ❌ | ❌ | ✅ |
| Manage Cycles | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + Tailwind CSS + shadcn/ui |
| Backend | Express.js (TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Microsoft Azure AD + MSAL v3 + JWT |
| State | TanStack Query |
| Charts | Recharts |
| Deployment | Vercel |

---

## 🚀 Local Setup

```bash
# Clone
git clone <repo-url> && cd Saarthi

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# Database
npx prisma migrate dev && npx prisma generate
```

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_AZURE_CLIENT_ID=
NEXT_PUBLIC_AZURE_TENANT_ID=
NEXT_PUBLIC_API_URL=
```

**Backend** (`.env`):
```env
DATABASE_URL=
JWT_SECRET=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=
```

---

## 📁 Project Structure

```
Saarthi/
├── frontend/          # Next.js 15 App Router
│   ├── app/           # Routes + layouts
│   ├── components/    # UI + dashboard components
│   └── lib/           # MSAL config, API clients, hooks
│
└── backend/           # Express.js API
    ├── src/
    │   ├── modules/   # goals, approvals, checkins, users
    │   ├── common/    # guards, scoring, AI services
    │   └── app.ts     # Express setup
    └── prisma/        # Schema + migrations
```

---
