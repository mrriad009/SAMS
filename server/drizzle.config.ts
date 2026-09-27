import { defineConfig } from 'drizzle-kit';
import './src/config/load-env.js';

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
