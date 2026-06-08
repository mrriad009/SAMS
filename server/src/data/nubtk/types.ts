export const NUBTK_DEPARTMENT = 'Computer Science & Engineering';
export const NUBTK_ACADEMIC_TERM = 'Spring 2026';
export const NUBTK_EFFECTIVE_FROM = '2026-05-19';

export interface ParsedRoutineSlot {
  dayOfWeek: number;
  dayLabel: string;
  shift: '1st' | '2nd';
  startTime: string;
  endTime: string;
  roomNumber: string;
  sectionLabel: string;
  semester: number;
  section: string;
  courseCode: string;
  teacherAcronym: string;
}

export interface ParsedFaculty {
  acronym: string;
  name: string;
  designation?: string;
  subject?: string;
  mobile?: string;
  email?: string;
}

export interface ParsedRepresentative {
  semester: number;
  section: string;
  role: 'CR' | 'ACR';
  studentNumber?: string;
  fullName: string;
  mobile?: string;
  email?: string;
}

export interface NubtkReferenceData {
  routineSlots: ParsedRoutineSlot[];
  faculty: ParsedFaculty[];
  representatives: ParsedRepresentative[];
  courseCodes: string[];
}
