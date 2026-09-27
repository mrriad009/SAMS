import fs from 'fs';
import path from 'path';
import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { notificationPreferences, pushSubscriptions, students, users } from '../models/schema.js';
import { sendEmail } from '../utils/mailer.js';
import { sendSms } from '../utils/sms.js';
import { createNotification } from './notification.service.js';
import { getLowAttendanceStudents } from './attendance.service.js';
import { getSetting } from './settings.service.js';

export type AlertType = 'low_attendance' | 'announcement' | 'session_reminder' | 'leave_update' | 'general';

type PreferenceRow = {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  lowAttendance: boolean;
  announcements: boolean;
  reminders: boolean;
  leaveUpdates: boolean;
};

let vapidReady = false;

function vapidFilePath() {
  return path.resolve(process.cwd(), '.vapid.json');
}

export function getVapidPublicKey(): string {
  const keys = loadVapidKeys();
  if (!vapidReady) {
    webpush.setVapidDetails('mailto:sams@localhost', keys.publicKey, keys.privateKey);
    vapidReady = true;
  }
  return keys.publicKey;
}

function loadVapidKeys(): { publicKey: string; privateKey: string } {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }

  const file = vapidFilePath();
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as { publicKey: string; privateKey: string };
  }

  const generated = webpush.generateVAPIDKeys();
  fs.writeFileSync(file, JSON.stringify(generated, null, 2));
  console.log('[Push] Generated VAPID keys in .vapid.json');
  return generated;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char];
  });
}

function allowsTopic(prefs: PreferenceRow, type: AlertType) {
  if (type === 'low_attendance') return prefs.lowAttendance;
  if (type === 'announcement') return prefs.announcements;
  if (type === 'session_reminder') return prefs.reminders;
  if (type === 'leave_update') return prefs.leaveUpdates;
  return true;
}

export async function getPreferences(userId: string): Promise<PreferenceRow> {
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (row) return row;

  return {
    userId,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    lowAttendance: true,
    announcements: true,
    reminders: true,
    leaveUpdates: true,
  };
}

export async function savePreferences(userId: string, input: Partial<Omit<PreferenceRow, 'userId'>>) {
  const current = await getPreferences(userId);
  const next = {
    pushEnabled: input.pushEnabled ?? current.pushEnabled,
    emailEnabled: input.emailEnabled ?? current.emailEnabled,
    smsEnabled: input.smsEnabled ?? current.smsEnabled,
    lowAttendance: input.lowAttendance ?? current.lowAttendance,
    announcements: input.announcements ?? current.announcements,
    reminders: input.reminders ?? current.reminders,
    leaveUpdates: input.leaveUpdates ?? current.leaveUpdates,
  };

  const [saved] = await db
    .insert(notificationPreferences)
    .values({ userId, ...next })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: next,
    })
    .returning();

  return saved;
}

export async function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  const [existing] = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(pushSubscriptions)
      .set({ userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth })
      .where(eq(pushSubscriptions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .returning();
  return created;
}

export async function removePushSubscription(userId: string, endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
  return { userId, endpoint };
}

async function sendPush(userId: string, title: string, message: string) {
  getVapidPublicKey();
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  let sent = false;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body: message })
      );
      sent = true;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
      } else {
        console.error('Push send failed:', error);
      }
    }
  }

  return sent;
}

export async function dispatchAlert(
  userId: string,
  data: { title: string; message: string; type: AlertType; referenceId?: string; referenceType?: string }
) {
  await createNotification(userId, data);
  const prefs = await getPreferences(userId);
  if (!allowsTopic(prefs, data.type)) {
    return { inApp: true, email: false, sms: false, push: false };
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const email = user && prefs.emailEnabled
    ? await sendEmail(user.email, data.title, `<p>${escapeHtml(data.message)}</p>`)
    : false;
  const sms = user?.phone && prefs.smsEnabled ? await sendSms(user.phone, `${data.title}: ${data.message}`) : false;
  const push = prefs.pushEnabled ? await sendPush(userId, data.title, data.message) : false;

  return { inApp: true, email, sms, push };
}

export async function sendWeeklyDefaulterAlerts(scope?: {
  department?: string;
  section?: string;
  semester?: number;
}) {
  const threshold = parseInt((await getSetting('attendance_threshold')) || '75', 10);
  const defaulters = await getLowAttendanceStudents(threshold, scope);
  let emailed = 0;
  let notified = 0;

  for (const student of defaulters) {
    const [row] = await db
      .select({ userId: students.userId, email: users.email, phone: users.phone })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, student.id))
      .limit(1);
    if (!row) continue;

    const message = `${student.name} (${student.studentId}) is at ${student.percentage}% attendance, below the ${threshold}% threshold.`;
    await createNotification(row.userId, {
      title: 'Weekly attendance summary',
      message,
      type: 'low_attendance',
    });
    notified += 1;

    const prefs = await getPreferences(row.userId);
    if (!prefs.lowAttendance) continue;
    if (prefs.emailEnabled) {
      const ok = await sendEmail(row.email, 'Weekly attendance summary', `<p>${escapeHtml(message)}</p>`);
      if (ok) emailed += 1;
    }
    if (prefs.smsEnabled && row.phone) {
      await sendSms(row.phone, message);
    }
    if (prefs.pushEnabled) {
      await sendPush(row.userId, 'Weekly attendance summary', message);
    }
  }

  return { defaulters: defaulters.length, notified, emailed, threshold };
}
