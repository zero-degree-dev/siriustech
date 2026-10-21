const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const { mkdir } = require('node:fs/promises');
const { createServer } = require('node:net');
require('reflect-metadata');

let postgres, pool, app, base;
async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function api(path, options = {}) {
  const { token, body, ...init } = options;
  const response = await fetch(`${base}/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: response.status === 204 ? undefined : await response.json() };
}
before(async () => {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const port = await freePort();
  const dir = resolve(__dirname, '../../.local/test-postgres', randomUUID());
  await mkdir(dir, { recursive: true });
  postgres = new EmbeddedPostgres({ databaseDir: dir, port, user: 'test', password: 'test', persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'], onLog() {}, onError() {} });
  await postgres.initialise();
  await postgres.start();
  process.env.DATABASE_URL = `postgresql://test:test@127.0.0.1:${port}/postgres`;
  process.env.CHAT_MODE = 'catalog';
  process.env.MCP_API_TOKEN = 'test-mcp-token';
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { migrate } = require('../dist/database/migrate');
  const { seed } = require('../dist/database/seed');
  await migrate(pool); await migrate(pool);
  await seed(pool); await seed(pool);
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../dist/app.module');
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0, '127.0.0.1');
  base = await app.getUrl();
}, { timeout: 60000 });
after(async () => {
  await app?.close();
  await pool?.end();
  await postgres?.stop();
});

test('migrations and seed are repeatable; catalog contains 12 themed services', async () => {
  const result = await api('services');
  assert.equal(result.status, 200);
  assert.equal(result.body.length, 12);
  assert.equal(new Set(result.body.map(item => item.id)).size, 12);
  assert.ok(result.body.every(item => item.priceFrom > 0 && item.faq.length && item.deliverables.length));
  const search = await api('services?q=CRM');
  assert.ok(search.body.some(item => item.id === 'software'));
  assert.equal((await api('services/not-a-service')).status, 404);
  assert.equal((await api('health')).body.status, 'ok');
});

test('requests validate consent, service and phone before saving to PostgreSQL', async () => {
  const body = { name: 'Тестовый клиент', company: 'Тест', phone: '+7 (999) 123-45-67', email: 'test@example.com', serviceId: 'web', consent: true };
  assert.equal((await api('requests', { method: 'POST', body: { ...body, consent: false } })).status, 400);
  assert.equal((await api('requests', { method: 'POST', body: { ...body, phone: '123' } })).status, 400);
  assert.equal((await api('requests', { method: 'POST', body: { ...body, serviceId: 'missing' } })).status, 404);
  const saved = await api('requests', { method: 'POST', body });
  assert.equal(saved.status, 201);
  const row = await pool.query('SELECT name, service_id FROM project_requests WHERE id=$1', [saved.body.id]);
  assert.equal(row.rows[0].service_id, 'web');
});

test('chat uses MCP catalog, persists history, isolates sessions and deduplicates retries', async () => {
  const session = await api('chat/sessions', { method: 'POST' });
  const token = session.body.token;
  assert.equal((await api('chat/messages')).status, 401);
  const body = { id: randomUUID(), text: 'Сколько стоит сайт и что входит в работу?', serviceId: 'web' };
  const reply = await api('chat/messages', { method: 'POST', token, body });
  assert.equal(reply.status, 200);
  assert.equal(reply.body.mode, 'catalog');
  assert.match(reply.body.text, /650/);
  assert.equal((await api('chat/messages', { method: 'POST', token, body })).body.id, reply.body.id);
  assert.equal((await api('chat/messages', { method: 'POST', token, body: { ...body, text: 'Changed' } })).status, 409);
  assert.equal((await api('chat/messages', { token })).body.messages.length, 2);
  const other = await api('chat/sessions', { method: 'POST' });
  assert.equal((await api('chat/messages', { token: other.body.token })).body.messages.length, 0);
  assert.equal((await api('chat/messages', { method: 'POST', token, body: { id: randomUUID(), text: 'x'.repeat(2001) } })).status, 400);
  assert.equal((await api('chat/session', { method: 'DELETE', token })).status, 204);
  assert.equal((await api('chat/messages', { token })).status, 401);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM chat_turns')).rows[0].count, 0);
});

test('MCP HTTP supports SDK initialization, tools and resource; rejects unauthorized clients', async () => {
  assert.equal((await fetch(`${base}/mcp`, { method: 'POST' })).status, 401);
  const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
  const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
  const client = new Client({ name: 'test', version: '1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), { requestInit: { headers: { Authorization: 'Bearer test-mcp-token' } } }));
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['get_service', 'list_services', 'recommend_services']);
    const result = await client.callTool({ name: 'get_service', arguments: { serviceId: 'ai' } });
    assert.equal(JSON.parse(result.content[0].text).id, 'ai');
    const resource = await client.readResource({ uri: 'siriustech://services' });
    assert.equal(JSON.parse(resource.contents[0].text).length, 12);
  } finally { await client.close(); }
});

test('Polza adapter sends server history and MCP context, hides upstream errors', async () => {
  const { ConsultationService } = require('../dist/chat/consultation.service');
  const { CatalogService } = require('../dist/catalog/catalog.service');
  const service = app.get(ConsultationService);
  const catalog = await app.get(CatalogService).list();
  const originalFetch = global.fetch;
  process.env.CHAT_MODE = 'polza';
  process.env.POLZA_API_KEY = 'test-key';
  let payload;
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://polza.ai/api/v1/chat/completions');
    payload = JSON.parse(options.body);
    return Response.json({ choices: [{ message: { content: 'Тестовая консультация' } }] });
  };
  try {
    const answer = await service.answer('Что дальше?', 'web', [{ role: 'user', content: 'Нужен сайт' }], catalog);
    assert.equal(answer.mode, 'polza');
    assert.match(payload.messages[1].content, /Сайты и корпоративные порталы/);
    assert.equal(payload.messages.at(-2).content, 'Нужен сайт');
    global.fetch = async () => Response.json({ secret: 'do-not-expose' }, { status: 429 });
    await assert.rejects(service.answer('test', 'web', [], catalog), error => error.getStatus() === 503 && !error.message.includes('do-not-expose'));
  } finally { global.fetch = originalFetch; process.env.CHAT_MODE = 'catalog'; }
});

test('Polza proxy is scoped to provider requests and is closed on shutdown', async () => {
  const { ConsultationService } = require('../dist/chat/consultation.service');
  const { CatalogService } = require('../dist/catalog/catalog.service');
  const { ProxyAgent, getGlobalDispatcher } = require('undici');
  const originalFetch = global.fetch;
  const previousProxy = process.env.POLZA_PROXY_URL;
  const globalDispatcher = getGlobalDispatcher();
  process.env.POLZA_PROXY_URL = 'http://127.0.0.1:10809';
  process.env.CHAT_MODE = 'polza';
  const service = new ConsultationService(app.get(CatalogService));
  let dispatcher;
  global.fetch = async (_url, options) => {
    dispatcher = options.dispatcher;
    return Response.json({ choices: [{ message: { content: 'Ответ через прокси' } }] });
  };
  try {
    const context = await app.get(CatalogService).list();
    assert.equal((await service.answer('Что входит в услугу?', 'web', [], context)).mode, 'polza');
    assert.ok(dispatcher instanceof ProxyAgent);
    assert.equal(getGlobalDispatcher(), globalDispatcher);
  } finally {
    global.fetch = originalFetch;
    process.env.CHAT_MODE = 'catalog';
    if (previousProxy === undefined) delete process.env.POLZA_PROXY_URL;
    else process.env.POLZA_PROXY_URL = previousProxy;
    await service.onModuleDestroy();
  }
});
