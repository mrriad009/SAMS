import { Resend } from 'resend';
import { env } from '../config/env.js';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.resend.apiKey) return null;
  if (!resend) resend = new Resend(env.resend.apiKey);
  return resend;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(`[Email skipped] To: ${to}, Subject: ${subject}`);
    return false;
  }
  try {
    await client.emails.send({
      from: env.resend.fromEmail,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}`;
  if (!getResend()) {
    console.log(`[Password reset] ${resetUrl}`);
  }
  return sendEmail(
    email,
    'Password Reset Request',
    `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
  );
}

export async function sendWelcomeEmail(
  email: string,
  tempPassword: string
): Promise<boolean> {
  return sendEmail(
    email,
    'Welcome to Attendance System',
    `<p>Your account has been created. Temporary password: <strong>${tempPassword}</strong></p><p>Please change it after logging in.</p>`
  );
}
