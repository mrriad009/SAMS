import { z } from 'zod';
import { DEPARTMENTS, SECTIONS } from '../config/constants.js';

export const departmentSchema = z.enum(DEPARTMENTS, {
  errorMap: () => ({ message: 'Please select a valid department' }),
});

export const sectionSchema = z.enum(SECTIONS, {
  errorMap: () => ({ message: 'Please select a valid section' }),
});
