import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { CatalogService } from '../catalog/catalog.service';
import { ConsultationService } from './consultation.service';
import { readConfig } from '../config';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
type Turn = { id: string; request_id: string; service_id: string | null; user_text: string; assistant_text: string; mode: 'catalog' | 'polza' };
const message = (turn: Turn) => ({ id: turn.id, role: 'assistant' as const, text: turn.assistant_text, mode: turn.mode });
@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService, private readonly catalog: CatalogService, private readonly consultation: ConsultationService) {}
  async create() {
    const token = randomBytes(32).toString('hex');
    await this.db.pool.query('INSERT INTO conversations(id, token_hash) VALUES ($1, $2)', [randomUUID(), hash(token)]);
    return { token, mode: readConfig().CHAT_MODE };
  }
  private tokenHash(token?: string) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException('Требуется токен диалога');
    return hash(token);
  }
  async history(token?: string) {
    const result = await this.db.pool.query('SELECT id FROM conversations WHERE token_hash=$1', [this.tokenHash(token)]);
    if (!result.rowCount) throw new UnauthorizedException('Диалог не найден');
    const turns = await this.db.pool.query<Turn>('SELECT * FROM (SELECT * FROM chat_turns WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT 50) recent ORDER BY created_at', [result.rows[0].id]);
    return { mode: readConfig().CHAT_MODE, messages: turns.rows.flatMap(turn => [
      { id: turn.request_id, role: 'user', text: turn.user_text }, message(turn),
    ]) };
  }
  async send(token: string | undefined, input: { id: string; text: string; serviceId?: string }) {
    const tokenHash = this.tokenHash(token);
    if (input.serviceId) await this.catalog.get(input.serviceId);
    // Resolve MCP context before reserving a connection for the conversation lock.
    const context = await this.consultation.context(input.serviceId);
    const client = await this.db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '5s'");
      const session = await client.query('SELECT id FROM conversations WHERE token_hash=$1 FOR UPDATE', [tokenHash]);
      if (!session.rowCount) throw new UnauthorizedException('Диалог не найден');
      const conversationId = session.rows[0].id;
      const existing = await client.query<Turn>('SELECT * FROM chat_turns WHERE conversation_id=$1 AND request_id=$2', [conversationId, input.id]);
      if (existing.rowCount) {
        const turn = existing.rows[0];
        if (turn.user_text !== input.text || turn.service_id !== (input.serviceId ?? null)) throw new ConflictException('Идентификатор сообщения уже использован');
        await client.query('COMMIT');
        return message(turn);
      }
      const previous = await client.query<Turn>('SELECT * FROM (SELECT * FROM chat_turns WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT 6) recent ORDER BY created_at', [conversationId]);
      const history = previous.rows.flatMap(turn => [
        { role: 'user' as const, content: turn.user_text },
        { role: 'assistant' as const, content: turn.assistant_text },
      ]);
      const answer = await this.consultation.answer(input.text, input.serviceId, history, context);
      const id = randomUUID();
      await client.query('INSERT INTO chat_turns(id, conversation_id, request_id, service_id, user_text, assistant_text, mode) VALUES ($1,$2,$3,$4,$5,$6,$7)', [id, conversationId, input.id, input.serviceId ?? null, input.text, answer.text, answer.mode]);
      await client.query('COMMIT');
      return { id, role: 'assistant' as const, ...answer };
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async remove(token?: string) {
    const result = await this.db.pool.query('DELETE FROM conversations WHERE token_hash=$1', [this.tokenHash(token)]);
    if (!result.rowCount) throw new NotFoundException('Диалог не найден');
  }
}
