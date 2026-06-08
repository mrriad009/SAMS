import { and, eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { academicFaculty, sectionRepresentatives } from '../models/schema.js';
import { NUBTK_ACADEMIC_TERM } from '../data/nubtk/types.js';

export async function listFaculty(department?: string) {
  const conditions = [eq(academicFaculty.academicTerm, NUBTK_ACADEMIC_TERM)];
  if (department) conditions.push(eq(academicFaculty.department, department));

  return db
    .select()
    .from(academicFaculty)
    .where(and(...conditions))
    .orderBy(academicFaculty.acronym);
}

export async function listRepresentatives(filters?: {
  department?: string;
  semester?: number;
  section?: string;
}) {
  const conditions = [eq(sectionRepresentatives.academicTerm, NUBTK_ACADEMIC_TERM)];
  if (filters?.department) conditions.push(eq(sectionRepresentatives.department, filters.department));
  if (filters?.semester != null) conditions.push(eq(sectionRepresentatives.semester, filters.semester));
  if (filters?.section) conditions.push(eq(sectionRepresentatives.section, filters.section));

  return db
    .select()
    .from(sectionRepresentatives)
    .where(and(...conditions))
    .orderBy(sectionRepresentatives.semester, sectionRepresentatives.section, sectionRepresentatives.role);
}
