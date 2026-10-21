import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { readConfig } from '../config';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: readConfig().DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 55000,
  });
  constructor() {
    this.pool.on('error', () => console.error('PostgreSQL connection error'));
  }
  async onModuleDestroy() { await this.pool.end(); }
}
