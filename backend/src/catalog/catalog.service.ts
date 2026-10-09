import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { DatabaseService } from '../database/database.service';

export const serviceSchema = z.object({
  id: z.string().min(1), title: z.string(), description: z.string(),
  category: z.string().optional(), detail: z.string().optional(),
  priceFrom: z.number().int().positive(), priceUnit: z.string(),
  duration: z.string(), deliverables: z.array(z.string()),
  questions: z.array(z.string()), keywords: z.array(z.string()),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
});
export type Service = z.infer<typeof serviceSchema>;
export function rankServices(services: Service[], query = '') {
  const words = query.toLocaleLowerCase('ru').match(/[\p{L}\d]+/gu)?.filter(word => word.length > 2 || word === '1с' || word === 'bi') ?? [];
  if (!words.length) return services;
  return services.map(service => {
    const haystack = [service.title, service.description, ...service.keywords].join(' ').toLocaleLowerCase('ru');
    return { service, score: words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0) };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).map(item => item.service);
}
@Injectable()
export class CatalogService {
  constructor(private readonly db: DatabaseService) {}
  async list(query?: string): Promise<Service[]> {
    const result = await this.db.pool.query('SELECT data FROM services ORDER BY sort_order, id');
    return rankServices(result.rows.map(row => serviceSchema.parse(row.data)), query);
  }
  async get(id: string): Promise<Service> {
    const result = await this.db.pool.query('SELECT data FROM services WHERE id = $1', [id]);
    if (!result.rowCount) throw new NotFoundException('Услуга не найдена');
    return serviceSchema.parse(result.rows[0].data);
  }
}
