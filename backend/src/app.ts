import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './modules/auth/auth.routes.js';
import { cyclesRouter } from './modules/cycles/cycles.routes.js';
import { goalsRouter } from './modules/goals/goals.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { approvalsRouter } from './modules/approvals/approvals.routes.js';
import { checkinsRouter } from './modules/checkins/checkins.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { errorHandler } from './common/middleware/error-handler.js';

export function createApp() {
  const app = express();

  const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',');
  app.use(
    cors({
      origin: origins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.set('trust proxy', 1);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'saarthi-api' });
  });

  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/cycles', cyclesRouter);
  api.use('/goals', goalsRouter);
  api.use('/audit', auditRouter);
  api.use('/approvals', approvalsRouter);
  api.use('/checkins', checkinsRouter);
  api.use('/dashboard', dashboardRouter);
  api.use('/reports', reportsRouter);
  api.use('/notifications', notificationsRouter);
  api.use('/users', require('./modules/users/users.routes.js').usersRouter);
  api.use('/analytics', require('./modules/analytics/analytics.routes.js').analyticsRouter);
  api.use('/escalation', require('./modules/escalation/escalation.routes.js').escalationRouter);
  api.use('/ai', require('./modules/ai/ai.routes.js').aiRouter);
  app.use('/api/v1', api);

  app.use(errorHandler);
  return app;
}
