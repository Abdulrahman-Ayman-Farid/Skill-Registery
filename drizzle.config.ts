import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = new URL(process.env.DATABASE_URL!);
url.searchParams.delete('sslmode');

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: url.toString(),
    ssl: { rejectUnauthorized: false },
  },
});
