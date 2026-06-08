import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  NubtkReferenceData,
  ParsedFaculty,
  ParsedRepresentative,
  ParsedRoutineSlot,
} from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DAY_MAP: Record<string, number> = {
  saturday: 6,
  sunday: 7,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

const FIRST_SHIFT_TIMES = [
  { start: '08:30:00', end: '09:40:00' },
  { start: '09:40:00', end: '10:50:00' },
  { start: '10:50:00', end: '12:00:00' },
  { start: '12:00:00', end: '13:10:00' },
];

const SECOND_SHIFT_TIMES = [
  { start: '14:10:00', end: '15:20:00' },
  { start: '15:20:00', end: '16:30:00' },
  { start: '16:30:00', end: '17:40:00' },
];

const CELL_PATTERN =
  /^(\d{1,2}[A-Z])\s*·\s*([A-Z]+\s*\d{4}(?:\([A-Z]\))?)\s*·\s*\[([A-Z]+)\]$/i;

function defaultMdPath() {
  return path.resolve(__dirname, '../../../data/nubtk/NUBTK-CSE-Spring2026-Complete.md');
}

function normalizeCourseCode(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().toUpperCase();
}

function parseSectionLabel(label: string): { semester: number; section: string } | null {
  const match = label.trim().match(/^(\d)([A-H])$/i);
  if (!match) return null;
  return { semester: parseInt(match[1], 10), section: match[2].toUpperCase() };
}

function parseCseSectionColumn(value: string): { semester: number; section: string } | null {
  const match = value.trim().match(/^CSE\s+(\d)([A-H])$/i);
  if (!match) return null;
  return { semester: parseInt(match[1], 10), section: match[2].toUpperCase() };
}

function cleanRoom(raw: string): string {
  const text = raw.replace(/\*\*/g, '').trim();
  const labMatch = text.match(/^(.+?)\s*\((\d+)\)$/i);
  if (labMatch) return `${labMatch[1].trim()} (${labMatch[2]})`;
  return text;
}

function parseRoutineCell(cell: string) {
  const trimmed = cell.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return null;
  const match = trimmed.match(CELL_PATTERN);
  if (!match) return null;

  const sectionInfo = parseSectionLabel(match[1]);
  if (!sectionInfo) return null;

  return {
    ...sectionInfo,
    courseCode: normalizeCourseCode(match[2]),
    teacherAcronym: match[3].toUpperCase(),
  };
}

function parseRoutineTables(content: string): ParsedRoutineSlot[] {
  const slots: ParsedRoutineSlot[] = [];
  const sections = content.split(/^### 📅 /m).slice(1);

  for (const block of sections) {
    const headerMatch = block.match(/^(\w+)\s*—\s*(1st|2nd)\s*Shift/im);
    if (!headerMatch) continue;

    const dayLabel = headerMatch[1].toLowerCase();
    if (dayLabel.includes('weekend')) continue;

    const dayOfWeek = DAY_MAP[dayLabel];
    if (!dayOfWeek) continue;

    const shift = headerMatch[2].toLowerCase() === '1st' ? '1st' : '2nd';
    const times = shift === '1st' ? FIRST_SHIFT_TIMES : SECOND_SHIFT_TIMES;

    const tableLines = block
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('|') && !line.includes('---'));

    for (const line of tableLines) {
      if (/^\|\s*Room\s*\|/i.test(line)) continue;

      const cols = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      if (cols.length < 2) continue;

      const roomNumber = cleanRoom(cols[0]);

      for (let i = 1; i < cols.length && i - 1 < times.length; i++) {
        const parsed = parseRoutineCell(cols[i]);
        if (!parsed) continue;

        slots.push({
          dayOfWeek,
          dayLabel: headerMatch[1],
          shift,
          startTime: times[i - 1].start,
          endTime: times[i - 1].end,
          roomNumber,
          sectionLabel: `${parsed.semester}${parsed.section}`,
          semester: parsed.semester,
          section: parsed.section,
          courseCode: parsed.courseCode,
          teacherAcronym: parsed.teacherAcronym,
        });
      }
    }
  }

  return slots;
}

function parseFacultyLookup(content: string): ParsedFaculty[] {
  const start = content.indexOf('## 7. Quick Lookup — Faculty by Acronym');
  const end = content.indexOf('## 8. Section-wise CR Contact Directory');
  if (start === -1 || end === -1) return [];

  const block = content.slice(start, end);
  const faculty: ParsedFaculty[] = [];
  const seen = new Set<string>();

  for (const line of block.split('\n')) {
    if (!line.startsWith('|') || line.includes('Acronym') || line.includes('---')) continue;

    const cols = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cols.length < 4) continue;

    const acronym = cols[0].replace(/\*\*/g, '').trim();
    if (!acronym || acronym === '—' || seen.has(acronym)) continue;
    seen.add(acronym);

    faculty.push({
      acronym,
      name: cols[1],
      subject: cols[2] || undefined,
      mobile: cols[3] || undefined,
    });
  }

  return faculty;
}

function parseRepresentatives(content: string): ParsedRepresentative[] {
  const start = content.indexOf('## 6. CR & ACR List (Spring 2026)');
  const end = content.indexOf('## 7. Quick Lookup — Faculty by Acronym');
  if (start === -1 || end === -1) return [];

  const block = content.slice(start, end);
  const reps: ParsedRepresentative[] = [];

  for (const line of block.split('\n')) {
    if (!line.startsWith('|') || line.includes('Section') || line.includes('---')) continue;
    if (line.includes('ECSE')) continue;

    const cols = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cols.length < 6) continue;

    const sectionInfo = parseCseSectionColumn(cols[0]);
    if (!sectionInfo) continue;

    const role = cols[1].toUpperCase();
    if (role !== 'CR' && role !== 'ACR') continue;

    const studentNumber = cols[2] !== '—' ? cols[2] : undefined;
    const fullName = cols[3];
    if (!fullName || fullName === '—') continue;

    reps.push({
      semester: sectionInfo.semester,
      section: sectionInfo.section,
      role,
      studentNumber,
      fullName,
      mobile: cols[4] !== '—' ? cols[4] : undefined,
      email: cols[5] !== '—' ? cols[5] : undefined,
    });
  }

  return reps;
}

export function parseNubtkMarkdown(filePath = defaultMdPath()): NubtkReferenceData {
  const content = fs.readFileSync(filePath, 'utf-8');
  const routineSlots = parseRoutineTables(content);
  const faculty = parseFacultyLookup(content);
  const representatives = parseRepresentatives(content);
  const courseCodes = [...new Set(routineSlots.map((slot) => slot.courseCode))].sort();

  return {
    routineSlots,
    faculty,
    representatives,
    courseCodes,
  };
}

/** NUBTK uses (C) on routine slots for lab / continuous-assessment sessions */
export function isLabCourseCode(courseCode: string): boolean {
  return /\([A-Z]\)\s*$/i.test(courseCode.trim());
}

export function courseTitleFromCode(courseCode: string): string {
  const code = normalizeCourseCode(courseCode);
  const labMatch = code.match(/^(.+?)\s*\(([A-Z])\)$/);
  if (labMatch) {
    const base = labMatch[1].trim();
    if (labMatch[2] === 'C') return `${base} (Lab)`;
    return `${base} (${labMatch[2]})`;
  }
  return code;
}
