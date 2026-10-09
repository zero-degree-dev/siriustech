import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { parse } from 'dotenv';
import pg from 'pg';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const children = new Set();
let database;
let stopping = false;

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  // Stop only processes started by this launcher; existing services are reused.
  await Promise.all([...children].map(child => new Promise(resolve => {
    child.once('exit', resolve);
    child.kill();
  })));
  await database?.stop();
}
process.once('SIGINT', () => void stop());
process.once('SIGTERM', () => void stop());

function launch(script, args = [], env = process.env, persistent = false) {
  if (stopping) throw new Error('Startup cancelled');
  const child = spawn(process.execPath, [script, ...args], { cwd: root, env, stdio: 'inherit', windowsHide: true });
  children.add(child);
  const done = new Promise((resolve, reject) => {
    child.once('error', () => { children.delete(child); reject(new Error('Could not start a development process')); });
    child.once('exit', code => {
      children.delete(child);
      if (persistent && !stopping) void stop(code || 1);
      if (code && !stopping) reject(new Error(`Development process exited with code ${code}`));
      else resolve();
    });
  });
  if (persistent) void done.catch(error => { console.error(error.message); void stop(1); });
  return done;
}

async function databaseReady(connectionString) {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 2000 });
  try { await pool.query('SELECT 1'); return true; }
  catch (error) {
    const unavailable = ['ECONNREFUSED', '3D000'];
    if (unavailable.includes(error.code) || error.errors?.every(item => unavailable.includes(item.code))) return false;
    throw new Error('Cannot connect to PostgreSQL. Check DATABASE_URL and database permissions.');
  } finally { await pool.end(); }
}

async function healthy(url) {
  try {
    const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok && (await response.json()).status === 'ok';
  } catch { return false; }
}

try {
  const config = { ...parse(await readFile(new URL('../backend/.env', import.meta.url))), ...process.env };
  if (!config.DATABASE_URL) throw new Error('Set DATABASE_URL in backend/.env (see backend/.env.example).');
  const url = new URL(config.DATABASE_URL);
  const isDefaultLocal = ['localhost', '127.0.0.1'].includes(url.hostname)
    && (url.port || '5432') === '5432' && url.pathname === '/siriustech'
    && url.username === 'siriustech' && url.password === 'siriustech';
  // The bundled server listens on IPv4; Windows can reject the IPv6 localhost attempt.
  if (isDefaultLocal) { url.hostname = '127.0.0.1'; config.DATABASE_URL = url.toString(); }
  if (!await databaseReady(config.DATABASE_URL)) {
    if (!isDefaultLocal) throw new Error('PostgreSQL is unavailable. Start the database configured in backend/.env.');
    console.log('Starting local PostgreSQL…');
    const { startLocalPostgres } = await import('./local-postgres.mjs');
    database = await startLocalPostgres();
  } else console.log('Using running PostgreSQL.');

  const host = config.HOST === '0.0.0.0' ? '127.0.0.1' : config.HOST || '127.0.0.1';
  const api = `http://${host}:${config.PORT || 4000}`;
  if (!await healthy(api)) {
    console.log('Building NestJS and preparing the database…');
    await launch(require.resolve('typescript/bin/tsc'), ['-p', 'backend/tsconfig.json']);
    await launch('backend/dist/database/migrate.js', [], config);
    await launch('backend/dist/database/seed.js', [], config);
    void launch('backend/dist/main.js', [], config, true);
    const deadline = Date.now() + 20000;
    while (!await healthy(api)) {
      if (stopping || Date.now() > deadline) throw new Error('NestJS did not become ready. Check the server output above.');
      await delay(250);
    }
  } else console.log('Using running NestJS API.');
  console.log(`Assistant backend ready: ${api}`);
  if (!process.argv.includes('--services-only')) {
    // Do not forward backend/.env (including the Polza key) to Next.js.
    void launch(require.resolve('next/dist/bin/next'), ['dev', '--hostname', '0.0.0.0', ...process.argv.slice(2)], { ...process.env, API_BASE_URL: api }, true);
  }
} catch (error) {
  console.error(error.code === 'ENOENT' ? 'Create backend/.env from backend/.env.example before starting.' : error.message);
  await stop(1);
}
