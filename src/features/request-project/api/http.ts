import { ApiError, request } from '@/shared/api';
import type { RequestRepository } from '../model/types';
export const requestRepository: RequestRepository = {
  async submit(data, signal) {
    const result = await request<{ id: string }>('/api/requests', { method: 'POST', json: data, signal });
    if (!result || typeof result.id !== 'string') throw new ApiError('Некорректный ответ сервера', 'parse');
    return result;
  },
};
