import type { DayOfWeek } from './index';

export const DAY_CONFIG: Record<DayOfWeek, { label: string, short: string, color: string }> = {
  MON: { label: 'จันทร์', short: 'จ', color: '#EAB308' }, // Yellow
  TUE: { label: 'อังคาร', short: 'อ', color: '#EC4899' }, // Pink
  WED: { label: 'พุธ', short: 'พ', color: '#22C55E' },    // Green
  THU: { label: 'พฤหัสบดี', short: 'พฤ', color: '#F97316' }, // Orange
  FRI: { label: 'ศุกร์', short: 'ศ', color: '#3B82F6' },   // Blue
  SAT: { label: 'เสาร์', short: 'ส', color: '#A855F7' },  // Purple
  SUN: { label: 'อาทิตย์', short: 'อา', color: '#EF4444' } // Red
};

export const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
