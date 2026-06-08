import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from '../config/env.js';

export function configureCloudinary(): void {
  if (!isCloudinaryConfigured()) {
    if (env.cloudinary.cloudName) {
      console.warn(
        'Cloudinary credentials look invalid or incomplete — profile photos will use local storage.'
      );
      console.warn(
        'Set CLOUDINARY_CLOUD_NAME to your dashboard cloud name (e.g. dxyz123abc), not a placeholder like "Root".'
      );
    }
    return;
  }

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder = 'avatars'
): Promise<string | null> {
  if (!isCloudinaryConfigured()) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url || null);
      }
    );
    stream.end(buffer);
  });
}
