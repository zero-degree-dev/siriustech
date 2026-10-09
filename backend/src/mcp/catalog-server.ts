import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CatalogService } from '../catalog/catalog.service';

export function createCatalogMcp(catalog: CatalogService) {
  const server = new McpServer({ name: 'siriustech-catalog', version: '1.0.0' });
  const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });
  server.registerTool('list_services', {
    description: 'Каталог демонстрационных ИТ-услуг СириусТех. Цены и сроки ориентировочные.',
    inputSchema: { query: z.string().max(2000).optional() }, annotations,
  }, async ({ query }) => result(await catalog.list(query)));
  server.registerTool('get_service', {
    description: 'Состав работ, ориентировочная цена, сроки, FAQ и вопросы для уточнения требований к услуге.',
    inputSchema: { serviceId: z.string().min(1).max(100) }, annotations,
  }, async ({ serviceId }) => {
    try { return result(await catalog.get(serviceId)); }
    catch { return { ...result({ error: 'Услуга не найдена или каталог временно недоступен' }), isError: true }; }
  });
  server.registerTool('recommend_services', {
    description: 'Подобрать до трёх услуг по описанию задачи. Для уточнения состава используйте get_service.',
    inputSchema: { task: z.string().min(1).max(2000) }, annotations,
  }, async ({ task }) => result((await catalog.list(task)).slice(0, 3)));
  server.registerResource('services', 'siriustech://services', {
    description: 'Каталог услуг и FAQ', mimeType: 'application/json',
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await catalog.list()) }] }));
  server.registerPrompt('service_consultation', {
    description: 'Консультация по услугам СириусТех с опорой на каталог.',
    argsSchema: { task: z.string() },
  }, ({ task }) => ({ messages: [{ role: 'user', content: { type: 'text', text: `Помоги подобрать услугу СириусТех для задачи: ${task}. Используй recommend_services и get_service. Все цены в каталоге демонстрационные. Уточни требования, не обещай точную смету.` } }] }));
  return server;
}
