import { ApiError, request } from '@/shared/api';
import type { ChatMessage, ChatRepository } from '../model/types';

const storageKey = 'siriustech-chat-token';
function validMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.text === 'string' && ['user', 'assistant'].includes(String(item.role));
}
export function createChatRepository(): ChatRepository & { selectService(id: string): void } {
  let serviceId = '';
  let token: string | undefined;
  let selectedForRequest: { id: string; serviceId: string } | undefined;
  async function ensureToken(signal?: AbortSignal) {
    if (!token) { try { token = sessionStorage.getItem(storageKey) ?? undefined; } catch { /* In-memory session if browser storage is unavailable. */ } }
    if (!token) {
      const data = await request<{ token: string }>('/api/chat/sessions', { method: 'POST', signal });
      if (!data || typeof data.token !== 'string') throw new ApiError('Некорректная сессия', 'parse');
      token = data.token;
      try { sessionStorage.setItem(storageKey, token); } catch { /* Keep token in memory. */ }
    }
    return token;
  }
  return {
    selectService(id) { serviceId = id; },
    async load(signal) {
      const auth = await ensureToken(signal);
      const data = await request<{ messages: unknown; mode: string }>('/api/chat/messages', { headers: { Authorization: `Bearer ${auth}` }, signal });
      if (!data || !Array.isArray(data.messages) || !data.messages.every(validMessage) || !['polza', 'catalog'].includes(data.mode)) throw new ApiError('Некорректная история', 'parse');
      return { messages: data.messages, mode: data.mode as 'polza' | 'catalog' };
    },
    async send(messages, signal) {
      const latest = messages.at(-1);
      if (!latest || latest.role !== 'user') throw new ApiError('Нет сообщения', 'parse');
      if (selectedForRequest?.id !== latest.id) selectedForRequest = { id: latest.id, serviceId };
      const auth = await ensureToken(signal);
      const data = await request<unknown>('/api/chat/messages', {
        method: 'POST', headers: { Authorization: `Bearer ${auth}` }, signal, timeoutMs: 60000,
        json: { id: latest.id, text: latest.text, ...(selectedForRequest.serviceId ? { serviceId: selectedForRequest.serviceId } : {}) },
      });
      if (!validMessage(data) || data.role !== 'assistant') throw new ApiError('Некорректный ответ консультанта', 'parse');
      return data;
    },
    async reset(signal) {
      const auth = await ensureToken(signal);
      try { await request('/api/chat/session', { method: 'DELETE', headers: { Authorization: `Bearer ${auth}` }, signal }); }
      catch (error) { if (!(error instanceof ApiError) || ![401, 404].includes(error.status ?? 0)) throw error; }
      token = undefined;
      selectedForRequest = undefined;
      try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
    },
  };
}
