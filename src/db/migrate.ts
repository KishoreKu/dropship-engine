import { execSync } from 'child_process';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Running Prisma migrations…');
  execSync('npx prisma generate', { stdio: 'inherit' });
  execSync('npx prisma db push', { stdio: 'inherit' });
  logger.info('Database is up to date');
}

main().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
