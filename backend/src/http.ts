import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { CatalogService } from './catalog/catalog.service';
import { DatabaseService } from './database/database.service';
import { ChatService } from './chat/chat.service';
import { readConfig } from './config';

export const requestSchema = z.object({
  name: z.string().trim().min(1).max(150), company: z.string().trim().max(200).default(''),
  phone: z.string().max(40).regex(/^[+\d\s()–-]+$/).refine(value => { const digits = value.replace(/\D/g, ''); return digits.length >= 10 && digits.length <= 15; }),
  email: z.string().trim().email().max(254), serviceId: z.string().min(1).max(100), consent: z.literal(true),
}).strict();
export const chatSchema = z.object({ id: z.string().uuid(), text: z.string().trim().min(1).max(2000), serviceId: z.string().min(1).max(100).optional() }).strict();
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new BadRequestException(result.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })));
  return result.data;
}
function bearer(header?: string) { return header?.startsWith('Bearer ') ? header.slice(7) : undefined; }

@Controller('api')
export class ApiController {
  constructor(private readonly catalog: CatalogService, private readonly db: DatabaseService, private readonly chat: ChatService) {}
  @Get('health') async health() {
    await this.db.pool.query('SELECT 1 FROM services LIMIT 1');
    return { status: 'ok', chatMode: readConfig().CHAT_MODE };
  }
  @Get('services') list(@Query('q') query?: string) { return this.catalog.list(parse(z.string().max(2000).optional(), query)); }
  @Get('services/:id') get(@Param('id') id: string) { return this.catalog.get(id); }
  @Post('requests')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async request(@Body() body: unknown) {
    const data = parse(requestSchema, body);
    await this.catalog.get(data.serviceId);
    const id = randomUUID();
    await this.db.pool.query('INSERT INTO project_requests(id,name,company,phone,email,service_id,consent) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, data.name, data.company, data.phone, data.email, data.serviceId, data.consent]);
    return { id };
  }
  @Post('chat/sessions')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create() { return this.chat.create(); }
  @Get('chat/messages') history(@Headers('authorization') header?: string) { return this.chat.history(bearer(header)); }
  @Post('chat/messages')
  @HttpCode(200)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  send(@Body() body: unknown, @Headers('authorization') header?: string) { return this.chat.send(bearer(header), parse(chatSchema, body)); }
  @Delete('chat/session')
  @HttpCode(204)
  remove(@Headers('authorization') header?: string) { return this.chat.remove(bearer(header)); }
}
