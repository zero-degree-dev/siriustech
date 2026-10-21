import { All, Controller, ForbiddenException, Req, Res, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { CatalogService } from '../catalog/catalog.service';
import { createCatalogMcp } from './catalog-server';
import { readConfig } from '../config';

@Controller('mcp')
export class McpController {
  constructor(private readonly catalog: CatalogService) {}
  @All()
  async handle(@Req() req: Request, @Res() res: Response) {
    const config = readConfig();
    if (!config.MCP_API_TOKEN) throw new ServiceUnavailableException('HTTP MCP is disabled; set MCP_API_TOKEN');
    const expected = Buffer.from(`Bearer ${config.MCP_API_TOKEN}`);
    const actual = Buffer.from(req.headers.authorization ?? '');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException();
    if (req.headers.origin && req.headers.origin !== config.FRONTEND_ORIGIN) throw new ForbiddenException('Origin is not allowed');
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); res.status(405).end(); return; }
    const server = createCatalogMcp(this.catalog);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { void transport.close(); void server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
}
