import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './common/db/prisma.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = createApp();

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  async function start() {
    if (!process.env.JWT_SECRET?.trim()) {
      console.error('Missing JWT_SECRET in backend/.env — copy from .env.example');
      process.exit(1);
    }
    if (!process.env.JWT_REFRESH_SECRET?.trim()) {
      console.error('Missing JWT_REFRESH_SECRET in backend/.env');
      process.exit(1);
    }

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      console.error(
        'Database not ready. From backend/ run:\n  npm run db:migrate\n  npm run db:seed',
      );
      console.error(err);
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Saarthi API listening on http://localhost:${PORT}`);
    });
  }

  start();
}

export default app;
