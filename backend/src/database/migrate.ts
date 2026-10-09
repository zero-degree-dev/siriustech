import { Pool } from 'pg';
import { readConfig } from '../config';

export async function migrate(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(871204)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const applied = await client.query('SELECT version FROM schema_migrations WHERE version = 1');
    if (!applied.rowCount) {
      await client.query(`
        CREATE TABLE services (
          id text PRIMARY KEY,
          sort_order integer NOT NULL,
          data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object' AND data->>'id' = id)
        );
        CREATE TABLE project_requests (
          id uuid PRIMARY KEY,
          name text NOT NULL,
          company text NOT NULL DEFAULT '',
          phone text NOT NULL,
          email text NOT NULL,
          service_id text NOT NULL REFERENCES services(id),
          consent boolean NOT NULL CHECK (consent),
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE conversations (
          id uuid PRIMARY KEY,
          token_hash text UNIQUE NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE chat_turns (
          id uuid PRIMARY KEY,
          conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          request_id uuid NOT NULL,
          service_id text REFERENCES services(id),
          user_text text NOT NULL,
          assistant_text text NOT NULL,
          mode text NOT NULL CHECK (mode IN ('catalog', 'polza')),
          created_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (conversation_id, request_id)
        );
        CREATE INDEX chat_turns_history ON chat_turns(conversation_id, created_at);
        INSERT INTO schema_migrations(version) VALUES (1);
      `);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
if (require.main === module) {
  const pool = new Pool({ connectionString: readConfig().DATABASE_URL });
  migrate(pool).then(() => console.log('Migrations applied')).catch(() => {
    console.error('Migration failed. Check DATABASE_URL and PostgreSQL availability.');
    process.exitCode = 1;
  }).finally(() => pool.end());
}
