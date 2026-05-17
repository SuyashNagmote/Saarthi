<div align="center">

# 🎯 Saarthi — In-House Goal Setting & Tracking Portal

### Submission for ATOMQUEST HACKATHON 1.0

**An enterprise-grade, rule-enforcing, AI-powered Performance Management System designed to eliminate fragmented workflows and align organizational priorities.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-green?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8-purple?logo=prisma)](https://www.prisma.io/)

</div>

---

## 📖 Executive Summary

Saarthi was architected from the ground up to solve the exact problem statement presented in the **ATOMQUEST HACKATHON 1.0 BRD**. It replaces spreadsheets and disjointed emails with a centralized, rule-enforced platform that covers the entire goal lifecycle.

Our submission guarantees **100% compliance** with all mandatory functional requirements, strict validation rules, check-in schedules, and governance constraints, while proudly implementing **ALL 4 Bonus Features** to deliver a truly production-ready enterprise product.

---

## 🏆 Hackathon Compliance Matrix

### 2.1 Phase 1 — Goal Creation & Approval (Must-Have)
✅ **Employee Interface:** Full CRUD for Goal Sheets mapping Thrust Areas, Descriptions, UoMs, and Targets.
✅ **Strict System Validation (Backend Enforced):**
- Total weightage must equal **exactly 100%** (blocks submission otherwise).
- Minimum weightage of **10%** per goal.
- Maximum of **8 goals** per employee per cycle.
✅ **Manager (L1) Workflow:** Managers can review, reject, or perform inline edits to targets/weightages. Approved goals are cryptographically locked.
✅ **Shared Goals / Cascading KPIs:** Managers can push departmental KPIs. Child goals inherit title/target (Read-Only) but allow weightage adjustment. Achievements automatically sync up to the primary owner.

### 2.2 Phase 2 — Achievement & Check-ins (Must-Have)
✅ **Quarterly Tracking:** Employees can update progress against planned targets and update status.
✅ **Manager Check-ins:** Managers can view Planned vs. Actual progress and log structured feedback comments.
✅ **System-Computed Scores:** Formula logic strictly mirrors BRD specifications:
- `Min (Numeric/%)`: Higher is better `(Achievement ÷ Target) * 100`
- `Max (Numeric/%)`: Lower is better `(Target ÷ Achievement) * 100`
- `Timeline`: Date-based completion algorithm.
- `Zero-Based`: `100%` if Zero incidents, else `0%`.

### 2.3 Check-in Schedule Enforcement
✅ **Time-Gated Windows:** The backend dynamically calculates the current month and completely disables submission endpoints outside the allowed BRD windows (May, July, Oct, Jan, Mar/Apr), throwing HTTP 403 `WINDOW_CLOSED` errors.

### 3. User Roles & Personas
✅ **Employee:** Draft goals, log actuals, update progress.
✅ **Manager (L1):** Approve team goals, conduct quarterly check-ins, push shared KPIs.
✅ **Admin / HR:** Configure org structure, manage cycles, access raw audit logs, and forcefully unlock goals.

### 4. Reporting & Governance
✅ **Achievement Report:** 1-click Excel export of Planned vs Actual data for all users.
✅ **Completion Dashboard:** Live tracking of check-in compliance across the org.
✅ **Immutable Audit Trail:** Every database mutation post-approval is permanently logged, capturing `Who`, `What`, `Old Value`, `New Value`, `IP`, and `User Agent`.

---

## ⭐ Bonus Features Implemented (Section 5)

Our team went above and beyond to implement every single "Good-to-Have" feature requested in the problem statement:

### 5.1 Microsoft Entra ID (Azure AD) Integration
- **Full SSO:** `@azure/msal-browser` and `@azure/msal-node` integration.
- **Auto-Provisioning:** First-time Azure logins instantly create PostgreSQL records.
- **Org Sync:** Queries MS Graph API `/me/manager` to auto-link reporting lines.
- **AD Group RBAC:** Maps users in `Saarthi-Admins` and `Saarthi-Managers` Azure groups directly to system Roles.

### 5.2 Email & Microsoft Teams Integration
- **Automated Emails:** Nodemailer triggers on Submission, Approval, Rejection, and Escalation.
- **Teams Adaptive Cards:** MS Teams webhook integration fires rich, interactive notification cards directly to a manager's channel when goals await approval.

### 5.3 Escalation Module (Rule-Based)
- **Automated SLAs:** A Node Cron job continuously evaluates pending approvals.
- **Breach Chain:** If a manager sits on an approval past the configured SLA (default 48h), the system automatically logs an SLA Breach and escalates visibility to Admins/HR.

### 5.4 Analytics Module
- **QoQ Trends:** Aggregated scoring trends per team/department.
- **Heatmaps:** Live completion tracking visualizer.
- **Goal Distribution:** Visual breakdown of Thrust Areas and Statuses.
- **Manager Effectiveness:** Checks L1 manager approval speeds and check-in compliance.

---

## 🏗️ Architecture & Technology Stack (Parameter 6: Cost Optimization)

Our architecture was intentionally designed for maximum performance, minimal cloud expenditure, and seamless scalability. 

```
┌─────────────────┐     REST/JSON      ┌─────────────────┐     Prisma ORM     ┌──────────────┐
│   Next.js 15    │ ◄──────────────► │   Express 5     │ ◄────────────────► │ PostgreSQL   │
│   (Vercel Edge) │     JWT Auth       │  (Serverless)   │                    │  (Neon DB)   │
└────────┬────────┘                    └────────┬────────┘                    └──────────────┘
         │                                      │
    ┌────┴────┐                           ┌─────┴─────┐
    │ MSAL.js │                           │ Azure AD  │
    │ Browser │ ── SSO ──────────────►    │ Graph API │
    └─────────┘                           └───────────┘
```

**Cost Optimization Strategies:**
- **Frontend:** Next.js 15 deployed on Vercel's global edge network (Free Tier).
- **Backend:** Stateless Express.js API designed to run flawlessly in serverless environments (Vercel Functions/Render) eliminating idle compute costs.
- **Database:** Neon Serverless PostgreSQL with auto-suspend compute to reduce active billing by up to 80% during non-working hours.
- **Caching:** TanStack Query implemented aggressively on the client-side to minimize redundant API calls and database reads.

---

## 🚀 Live Demo & Access

### URLs
- **Live Portal:** `https://<YOUR_FRONTEND_VERCEL_URL>`
- **API Health:** `https://<YOUR_BACKEND_VERCEL_URL>/health`

### Demo Credentials
To evaluate the platform without Microsoft SSO, use the following provisioned accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `sarah@techcorp.com` | `Admin@123` |
| **Manager** | `raj@techcorp.com` | `Manager@123` |
| **Employee** | `arjun@techcorp.com` | `Employee@123` |

---

## 🛠️ Local Development Setup

### 1. Install & Configure
```bash
git clone https://github.com/your-org/saarthi.git
cd saarthi
npm install
```

### 2. Environment Variables
Create a `backend/.env` file with the following keys:
```env
DATABASE_URL=postgresql://user:pass@host/db
DIRECT_URL=postgresql://user:pass@host/db
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Initialize Database
```bash
npm run db:push -w backend
npm run db:seed -w backend
```

### 4. Run Servers Concurrently
```bash
npm run dev
```

---

<div align="center">
  <sub>Built with ❤️ by the Saarthi Team for ATOMQUEST 1.0</sub>
</div>
