import { config } from './config/env';
import app from './app';
import { prisma } from './config/database';

async function main() {
  // Verify DB connection before accepting traffic
  try {
    await prisma.$connect();
    console.log('[DB] Connected to PostgreSQL');
  } catch (err) {
    console.error('[DB] Failed to connect:', err);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`[SERVER] Running on port ${config.port} (${config.nodeEnv})`);
  });
}

// Graceful shutdown — important for Railway deployments
process.on('SIGTERM', async () => {
  console.log('[SERVER] SIGTERM received. Closing...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
