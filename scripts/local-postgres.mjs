import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export async function startLocalPostgres() {
  const databaseDir = fileURLToPath(new URL('../.local/postgres', import.meta.url));
  await mkdir(databaseDir, { recursive: true });
  const postgres = new EmbeddedPostgres({ databaseDir, port: 5432, user: 'siriustech', password: 'siriustech', persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'], postgresFlags: ['-h', '127.0.0.1'], onLog() {}, onError() {} });
  if (!existsSync(`${databaseDir}/PG_VERSION`)) await postgres.initialise();
  await postgres.start();
  const client = postgres.getPgClient('postgres', '127.0.0.1');
  await client.connect();
  if (!(await client.query("SELECT 1 FROM pg_database WHERE datname='siriustech'")).rowCount) await client.query('CREATE DATABASE siriustech');
  await client.end();
  console.log('Local PostgreSQL ready on 127.0.0.1:5432. Data: .local/postgres. Stop with Ctrl+C.');
  return postgres;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const postgres = await startLocalPostgres();
  const keepAlive = setInterval(() => {}, 60000);
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    clearInterval(keepAlive);
    await postgres.stop();
  };
  process.once('SIGINT', () => void stop());
  process.once('SIGTERM', () => void stop());
}
