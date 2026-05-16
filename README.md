<div align="center">

# 🎯 Saarthi

### Enterprise Performance Management Platform

**AI-powered goal setting, tracking, and appraisal system for modern organizations**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-green?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8-purple?logo=prisma)](https://www.prisma.io/)

</div>

---

## 📖 Overview

Saarthi is a full-stack, enterprise-grade Performance Management System (PMS) that digitizes the entire employee goal lifecycle — from goal creation through quarterly check-ins to final appraisal. It replaces fragmented spreadsheet workflows with a unified platform featuring AI-assisted goal writing, real-time analytics, and automated escalation workflows.

### Why Saarthi?

| Problem | Saarthi Solution |
|---------|-----------------|
| Goals scattered across Excel sheets | Centralized goal repository with RBAC |
| Manual approval chains via email | One-click approval queue with inline editing |
| No visibility into team progress | Real-time dashboards with QoQ trends |
| Subjective performance ratings | AI-computed scores with SMART analysis |
| Delayed reviews & missed deadlines | Automated SLA escalation to admins |

---

## 🏗️ Architecture

```
┌─────────────────┐     REST/JSON      ┌─────────────────┐     Prisma ORM     ┌──────────────┐
│   Next.js 15    │ ◄──────────────► │   Express 5     │ ◄────────────────► │ PostgreSQL   │
│   (Frontend)    │     JWT Auth       │   (Backend)     │                    │    16        │
│   Port 3000     │                    │   Port 3001     │                    │  Port 5432   │
└────────┬────────┘                    └────────┬────────┘                    └──────────────┘
         │                                      │
    ┌────┴────┐                           ┌─────┴─────┐
    │ MSAL.js │                           │ Azure AD  │
    │ Browser │ ── SSO ──────────────►    │ Graph API │
    └─────────┘                           └───────────┘
```

**Hosting (Cost-Optimized — §6):**
- **Frontend:** Vercel (free tier)
- **Backend:** Render / Railway
- **Database:** Neon / Supabase (managed PostgreSQL)

---

## ✨ Features

### Core Modules

| Module | Description |
|--------|-------------|
| **🔐 Auth** | JWT access/refresh tokens, bcrypt hashing, Azure AD SSO with group-to-role mapping |
| **🎯 Goals** | CRUD with SMART scoring, duplicate title detection, weightage validation (must sum to 100%) |
| **✅ Approvals** | Manager approval queue with inline target/weightage editing, optimistic lock (409 conflict modal) |
| **📊 Check-ins** | Quarterly achievement logging with AI-parsed natural language input |
| **📈 Dashboard** | Role-based views (Employee / Manager / Admin) with Recharts visualizations |
| **📉 Analytics** | QoQ trend analysis, department completion heatmap, goal distribution breakdown |
| **👥 Users** | User directory, org tree visualization, admin CRUD with soft-delete |
| **🔔 Notifications** | In-app notification center with unread counts and mark-all-as-read |
| **📤 Reports** | Excel/CSV export with frozen headers, bold styling, and full audit trail export |
| **🤖 AI** | OpenAI-powered goal title generation, SMART score analysis, risk flagging |
| **⏰ Escalation** | SLA breach detection on pending approvals with admin email + in-app alerts |
| **📝 Audit** | Immutable audit log for every entity change with IP/user-agent tracking |

### Shared Goals System

- **Push-to-team:** Managers push goals to direct reports; children inherit `is_shared` and `primary_owner_id`
- **Read-only enforcement:** Non-primary owners cannot edit title or target (403); weightage remains editable
- **Achievement cascade:** Updating actual achievement on any linked goal propagates to all siblings + parent with `system/cascade` audit entries

### Security & Access Control

- **RBAC:** Three roles — `EMPLOYEE`, `MANAGER`, `ADMIN` — enforced at route and service layers
- **JWT Guard:** Every authenticated request re-validates `is_active` from DB (deactivated users are immediately blocked)
- **Azure AD SSO:** Group membership maps to roles (`Saarthi-Admins` → ADMIN, `Saarthi-Managers` → MANAGER)
- **Optimistic Locking:** Version-tracked approvals; 409 responses trigger a non-dismissible reload modal

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Express 5 | HTTP framework |
| Prisma 6 | Type-safe ORM |
| PostgreSQL 16 | Primary database |
| Zod | Request validation |
| jsonwebtoken | JWT auth |
| bcrypt | Password hashing |
| nodemailer | SMTP email (with dev console fallback) |
| exceljs | Excel/CSV report generation |
| @azure/msal-node | Azure AD server-side SSO |

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 15 (Turbopack) | React framework |
| React 19 | UI library |
| TanStack Query 5 | Server state management |
| Zustand 5 | Client state (auth store) |
| React Hook Form + Zod | Form handling + validation |
| Recharts 3 | Dashboard charts |
| Framer Motion | Animations |
| Lucide React | Icon system |
| @azure/msal-browser | Azure AD client-side SSO |
| Sonner | Toast notifications |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone & Install

```bash
git clone https://github.com/your-org/saarthi.git
cd saarthi
npm install
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | 64+ char random string |
| `JWT_REFRESH_SECRET` | ✅ | Different 64+ char random string |
| `OPENAI_API_KEY` | ❌ | Enables AI goal generation |
| `SMTP_HOST` | ❌ | SMTP server (falls back to console) |
| `AZURE_CLIENT_ID` | ❌ | Enables Azure AD SSO |
| `AZURE_TENANT_ID` | ❌ | Azure AD tenant |
| `ESCALATION_SLA_HOURS` | ❌ | SLA threshold (default: 48h) |

### 3. Initialize Database

> **Note:** No Docker required — an SQLite database file is created automatically at `backend/prisma/dev.db`.

```bash
npm run db:migrate -w backend
npm run db:seed -w backend      # Seeds demo users & cycles
```

### 4. Run Development Servers

```bash
npm run dev
```

This starts both servers concurrently:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001
- **Health check:** http://localhost:3001/health

### Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@saarthi.app | admin123 |
| Manager | manager@saarthi.app | manager123 |
| Employee | employee@saarthi.app | employee123 |

---

## 📁 Project Structure

```
saarthi/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 10 models, 8 enums
│   │   └── seed.ts                # Demo data seeder
│   └── src/
│       ├── common/
│       │   ├── guards/jwt.guard.ts
│       │   ├── services/
│       │   │   ├── audit.service.ts
│       │   │   └── email.service.ts    # Nodemailer + dev fallback
│       │   ├── middleware/error-handler.ts
│       │   └── utils/api-response.ts
│       ├── modules/
│       │   ├── ai/                # OpenAI integration
│       │   ├── analytics/         # QoQ, heatmap, distribution
│       │   ├── approvals/         # Manager review queue
│       │   ├── audit/             # Audit log queries
│       │   ├── auth/              # Login, register, Azure SSO
│       │   │   └── azure-sso.service.ts
│       │   ├── checkins/          # Quarterly achievement tracking
│       │   ├── cycles/            # Goal cycle management
│       │   ├── dashboard/         # Role-based dashboards
│       │   ├── escalation/        # SLA breach detection
│       │   ├── goals/             # Goal CRUD + shared goals
│       │   ├── notifications/     # In-app notifications
│       │   ├── reports/           # Excel/CSV exports
│       │   └── users/             # User directory + org tree
│       ├── app.ts                 # Express app factory
│       └── server.ts              # Entry point
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/         # Email + Azure AD login
│       │   │   └── register/      # Self-registration with manager select
│       │   └── (dashboard)/
│       │       ├── admin/         # User management, templates
│       │       ├── analytics/     # Charts + heatmaps
│       │       ├── approvals/     # Approval queue
│       │       ├── audit/         # Audit log viewer
│       │       ├── checkins/      # Check-in form
│       │       ├── dashboard/     # Role-based home
│       │       ├── goals/         # Goal list, create, edit, detail
│       │       ├── notifications/ # Notification center
│       │       ├── profile/       # User profile + password change
│       │       ├── reports/       # Export center
│       │       └── team/          # Team overview (managers)
│       ├── components/
│       │   ├── common/            # DataTable, ConflictModal, GoalCard, etc.
│       │   ├── dashboard/         # Chart components
│       │   ├── forms/             # GoalForm, CheckInForm, ApprovalSidePanel
│       │   └── layout/            # Sidebar, TopBar
│       └── lib/
│           ├── api/               # API client + endpoint functions
│           ├── hooks/             # TanStack Query hooks
│           ├── stores/            # Zustand auth store
│           └── validations/       # Zod schemas
├── docker-compose.yml             # PostgreSQL 16
├── Architecture.drawio            # System architecture diagram
└── package.json                   # Workspace root
```

---

## 🔌 API Reference

All endpoints are prefixed with `/api/v1`. Authenticated routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Email/password login |
| POST | `/auth/azure` | Azure AD SSO login |
| POST | `/auth/register` | Self-registration |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Clear refresh cookie |
| GET | `/auth/me` | Current user profile |
| GET | `/auth/managers` | List managers (for registration) |
| PATCH | `/auth/change-password` | Change password |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/goals` | List user goals |
| POST | `/goals` | Create goal |
| GET | `/goals/:id` | Goal detail with check-ins |
| PATCH | `/goals/:id` | Update goal (shared goal restrictions enforced) |
| DELETE | `/goals/:id` | Delete draft goal |
| POST | `/goals/:id/submit` | Submit for approval |
| POST | `/goals/bulk-submit` | Submit all drafts |
| GET | `/goals/weightage-summary` | Weightage breakdown |
| GET | `/goals/check-title` | Duplicate title check |

### Approvals, Check-ins, Analytics, Reports, Users, Escalation
Full REST endpoints following the same pattern. See route files for details.

---

## 🧪 E2E Test Flow

1. **Employee:** Login → Create goals (ensure 100% weightage) → Submit → Log Q1 check-in
2. **Manager:** Approval queue → Inline edit target → Approve → Verify notification sent
3. **Admin:** Dashboard → Export Excel → Trigger escalation → Verify audit log
4. **Shared Goals:** Push goal to team → Verify child read-only → Update achievement on child → Confirm cascade to siblings

---

## 🔧 Configuration

### Azure AD SSO Setup

1. Register app in Azure Portal → App Registrations
2. Add redirect URI: `http://localhost:3000`
3. Create client secret
4. Set environment variables:
   ```
   AZURE_CLIENT_ID=<application-id>
   AZURE_CLIENT_SECRET=<client-secret>
   AZURE_TENANT_ID=<tenant-id>
   ```
5. Create security groups: `Saarthi-Admins`, `Saarthi-Managers`, `Saarthi-Employees`
6. Assign users to groups — roles sync automatically on login

### SMTP Email Setup

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Saarthi Platform <noreply@saarthi.app>
```

When `SMTP_HOST` is empty, all emails are logged to the console (dev mode).

---

## 📊 Database Schema

10 models with full referential integrity:

- **User** — RBAC roles, manager hierarchy, attrition scoring
- **GoalCycle** — Quarterly/annual review periods
- **Goal** — Core entity with SMART scoring, shared goal trees
- **Approval** — Version-tracked manager reviews
- **CheckIn** — Quarterly achievement records
- **AuditLog** — Immutable change history
- **Notification** — In-app alerts
- **EscalationRule** — Configurable SLA rules
- **EscalationLog** — Escalation execution history

---

## 🚢 Deployment

### Production Build

```bash
# Backend
cd backend && npm run build   # Outputs to dist/

# Frontend
cd frontend && npm run build  # Next.js static + SSR output
```

### Recommended Stack

| Service | Provider | Tier |
|---------|----------|------|
| Frontend | Vercel | Free / Pro |
| Backend | Render | Free / Starter |
| Database | Neon | Free (0.5 GB) |

---

## 📄 License

Proprietary — All rights reserved.

---

<div align="center">
  <sub>Built with ❤️ for enterprise performance management</sub>
</div>
