'use strict';

const env = require('./config/env');
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');

async function start() {
  try {
    await connectDatabase();
  } catch (_error) {
    // The friendly explanation is printed inside connectDatabase().
    console.error('[server] Startup aborted because the database is unavailable.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log('');
    console.log('==========================================================');
    console.log('  AlumniConnect API');
    console.log(`  Environment : ${env.NODE_ENV}`);
    console.log(`  Listening   : http://localhost:${env.port}`);
    console.log(`  API base    : http://localhost:${env.port}/api/v1`);
    console.log(`  Health      : http://localhost:${env.port}/health`);
    console.log('==========================================================');
    console.log('');
  });

  const shutdown = async (signal) => {
    console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('[server] Shutdown complete.');
      process.exit(0);
    });
    // Force exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

start();

module.exports = { start };
