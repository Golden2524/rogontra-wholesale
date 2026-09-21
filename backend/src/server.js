import { createApp } from './app.js';
import { getPort } from './config.js';
import { createDatabasePool } from './database.js';
import { createDatabaseCatalogue } from './database-catalogue.js';

const pool = createDatabasePool();
const app = createApp({ catalogue: createDatabaseCatalogue(pool) });
const port = getPort();

const server = app.listen(port, '0.0.0.0', () => {
  console.info(`Rogontra API is listening on port ${port}.`);
});

async function closeServer() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.once('SIGINT', closeServer);
process.once('SIGTERM', closeServer);
