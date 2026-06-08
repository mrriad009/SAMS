import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { env, isCloudinaryConfigured } from '../config/env.js';
import { uploadToCloudinary } from './cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads/avatars');

export async function ensureUploadDirs(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function saveAvatarLocally(userId: string, buffer: Buffer): Promise<string> {
  await ensureUploadDirs();
  const filename = `${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
  const filepath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filepath, buffer);
  return `${env.serverUrl}/uploads/avatars/${filename}`;
}

export async function uploadAvatarImage(userId: string, buffer: Buffer): Promise<string> {
  if (isCloudinaryConfigured()) {
    try {
      const url = await uploadToCloudinary(buffer);
      if (url) return url;
    } catch (error) {
      console.warn('Cloudinary upload failed, using local storage:', (error as Error).message);
    }
  }

  return saveAvatarLocally(userId, buffer);
}
