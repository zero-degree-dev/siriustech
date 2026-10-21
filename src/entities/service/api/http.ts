import { ApiError, request } from '@/shared/api';
import type { Service, ServiceRepository } from '../model/types';

export function isService(value: unknown): value is Service {
  if (!value || typeof value !== 'object') return false;
  const service = value as Record<string, unknown>;
  return ['id', 'title', 'description'].every(key => typeof service[key] === 'string')
    && ['category', 'detail', 'duration', 'priceUnit'].every(key => service[key] === undefined || typeof service[key] === 'string')
    && (service.priceFrom === undefined || typeof service.priceFrom === 'number');
}
export const serviceRepository: ServiceRepository = {
  async list(signal) {
    const data = await request<unknown>('/api/services', { signal });
    if (!Array.isArray(data) || !data.every(isService)) throw new ApiError('Некорректный каталог услуг', 'parse');
    return data;
  },
};
