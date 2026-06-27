import { defineConfig } from 'drizzle-kit';
import { env } from './config/env';
export default defineConfig({
  out: './drizzle/migrations',
  schema: './drizzle/schema.js',
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});