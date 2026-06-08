import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { teachers, users } from '../models/schema.js';
import { hashPassword } from '../services/auth.service.js';
import { buildCrAccounts } from '../data/nubtk/cr-accounts.js';

const LEGACY_TEACHER_EMAIL = 'teacher@teacher.com';

/** One CR account per (semester, section) with matching scope permissions */
export async function seedCrAccounts() {
  const accounts = buildCrAccounts();
  let created = 0;
  let updated = 0;

  const [legacy] = await db.select().from(users).where(eq(users.email, LEGACY_TEACHER_EMAIL)).limit(1);
  if (legacy) {
    await db.delete(users).where(eq(users.id, legacy.id));
  }

  for (const cr of accounts) {
    const passwordHash = await hashPassword(cr.password);
    const [existing] = await db.select().from(users).where(eq(users.email, cr.email)).limit(1);

    if (existing) {
      await db
        .update(users)
        .set({ name: cr.name, role: 'teacher', passwordHash, updatedAt: new Date() })
        .where(eq(users.id, existing.id));

      const [teacherRow] = await db.select().from(teachers).where(eq(teachers.userId, existing.id)).limit(1);
      if (teacherRow) {
        await db
          .update(teachers)
          .set({
            teacherId: cr.teacherId,
            designation: cr.designation,
            department: cr.department,
            staffType: cr.staffType,
            semester: cr.semester,
            section: cr.section,
          })
          .where(eq(teachers.id, teacherRow.id));
      } else {
        await db.insert(teachers).values({
          userId: existing.id,
          teacherId: cr.teacherId,
          designation: cr.designation,
          department: cr.department,
          staffType: cr.staffType,
          semester: cr.semester,
          section: cr.section,
        });
      }
      updated++;
      continue;
    }

    const [user] = await db
      .insert(users)
      .values({
        name: cr.name,
        email: cr.email,
        passwordHash,
        role: 'teacher',
      })
      .returning();

    await db.insert(teachers).values({
      userId: user.id,
      teacherId: cr.teacherId,
      designation: cr.designation,
      department: cr.department,
      staffType: cr.staffType,
      semester: cr.semester,
      section: cr.section,
    });
    created++;
  }

  return { total: accounts.length, created, updated };
}
