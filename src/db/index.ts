import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Strip sslmode from the URL: postgres.js treats sslmode=require/no-verify as
// full certificate verification, which fails against self-signed certs.
const url = new URL(process.env.DATABASE_URL!);
url.searchParams.delete('sslmode');

export const db = drizzle(
  postgres(url.toString(), {
    ssl: { rejectUnauthorized: false },
    connect_timeout: 8,
  }),
  { schema },
);
export { schema };
