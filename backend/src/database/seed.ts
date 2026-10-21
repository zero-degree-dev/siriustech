import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { readConfig } from '../config';
import { serviceSchema } from '../catalog/catalog.service';

export async function seed(pool: Pool) {
  const services = serviceSchema.array().parse(JSON.parse(await readFile(resolve(__dirname, '../../data/services.json'), 'utf8')));
  if (services.length !== 12 || new Set(services.map(service => service.id)).size !== 12) throw new Error('Expected 12 unique services');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [index, service] of services.entries()) {
      // Reruns neither duplicate nor overwrite content edited by the operator.
      await client.query('INSERT INTO services (id, sort_order, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [service.id, index, JSON.stringify(service)]);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
if (require.main === module) {
  const pool = new Pool({ connectionString: readConfig().DATABASE_URL });
  seed(pool).then(() => console.log('12 demo services seeded')).catch(() => {
    console.error('Seed failed. Apply migrations and check PostgreSQL availability.');
    process.exitCode = 1;
  }).finally(() => pool.end());
}
