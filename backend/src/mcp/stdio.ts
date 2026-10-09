import 'reflect-metadata';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DatabaseService } from '../database/database.service';
import { CatalogService } from '../catalog/catalog.service';
import { createCatalogMcp } from './catalog-server';

async function main() {
  const db = new DatabaseService();
  const server = createCatalogMcp(new CatalogService(db));
  const transport = new StdioServerTransport();
  const stop = async () => { await server.close(); await db.onModuleDestroy(); };
  process.once('SIGINT', () => void stop());
  process.once('SIGTERM', () => void stop());
  process.stdin.once('end', () => void stop());
  await server.connect(transport);
}
void main().catch(() => { console.error('MCP startup failed. Check backend configuration.'); process.exitCode = 1; });
