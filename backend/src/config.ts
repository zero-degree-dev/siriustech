import { config } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// Independent of the launching client's working directory (including MCP clients).
config({ path: resolve(__dirname, '../.env'), quiet: true });
const schema = z.object({
  DATABASE_URL: z.string().url().refine(value => /^postgres(ql)?:/.test(value)),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('127.0.0.1'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3000'),
  CHAT_MODE: z.enum(['catalog', 'polza']).default('catalog'),
  POLZA_API_KEY: z.string().optional(),
  POLZA_MODEL: z.string().min(1).default('openai/gpt-4o-mini'),
  POLZA_PROXY_URL: z.preprocess(value => value === '' ? undefined : value,
    z.string().url().refine(value => ['http:', 'https:'].includes(new URL(value).protocol)).optional()),
  MCP_API_TOKEN: z.string().optional(),
});
export function readConfig() {
  const result = schema.safeParse(process.env);
  if (!result.success) throw new Error(`Invalid configuration: ${result.error.issues.map(issue => issue.path.join('.')).join(', ')}`);
  if (result.data.CHAT_MODE === 'polza' && !result.data.POLZA_API_KEY) throw new Error('POLZA_API_KEY is required in polza mode');
  return result.data;
}
