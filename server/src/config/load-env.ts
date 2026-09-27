import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

// `npm run dev --prefix server` sets cwd to server/, but .env lives at the repo root.
dotenv.config({ path: path.resolve(configDir, '../../../.env') });
