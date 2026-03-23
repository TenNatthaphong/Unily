import { CourseCategory } from '@prisma/client';

/**
 * =============================================================================
 * ELECTIVE UTILITIES (SOURCE OF TRUTH)
 * =============================================================================
 */

export const ELECTIVE_MAP = {
  [CourseCategory.MAJOR_ELECTIVE]: 'CS elective',
  [CourseCategory.GENERAL_EDUCATION]: 'GE/LANG/SOCIAL/SPORT/HUMAN elective',
  [CourseCategory.FREE_ELECTIVE]: 'Free elective'
};

export const NON_ELECTIVE_CATEGORIES = [
  CourseCategory.REQUIRED_COURSE,
  CourseCategory.CORE_COURSE,
  CourseCategory.COOP_COURSE
];

/**
 * Checks if a course category is considered an elective.
 */
export const isElective = (category: CourseCategory): boolean => {
  return category in ELECTIVE_MAP;
};

/**
 * Returns the human-readable elective name for frontend.
 */
export const getElectiveName = (category: CourseCategory): string => {
  return ELECTIVE_MAP[category] || 'N/A';
};
