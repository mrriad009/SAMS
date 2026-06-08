import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '5005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  serverUrl: process.env.SERVER_URL || `http://localhost:${parseInt(process.env.PORT || '5005', 10)}`,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'Attendance System <onboarding@resend.dev>',
  },
  isProduction: process.env.NODE_ENV === 'production',
};

const PLACEHOLDER_CLOUD_NAMES = new Set(['root', 'your_cloud_name', 'your-cloud-name', 'cloud_name']);

/** All three vars required; cloud name must be your real Cloudinary dashboard name */
export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) return false;
  if (PLACEHOLDER_CLOUD_NAMES.has(cloudName.trim().toLowerCase())) return false;
  return true;
}

export function validateEnv(): void {
  if (!env.databaseUrl) {
    console.warn('Warning: DATABASE_URL not set. Database operations will fail.');
  }
}
