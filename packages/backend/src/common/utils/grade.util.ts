import { Grade } from '@prisma/client';

export function calculateGrade(score: number): Grade {
  if (score >= 80) return Grade.A;
  if (score >= 75) return Grade.B_PLUS;
  if (score >= 70) return Grade.B;
  if (score >= 65) return Grade.C_PLUS;
  if (score >= 60) return Grade.C;
  if (score >= 50) return Grade.D_PLUS;
  if (score >= 40) return Grade.D;
  return Grade.F;
}

export function getGradePoint(grade: Grade): number {
  const points: Record<Grade, number> = {
    [Grade.A]: 4.0,
    [Grade.B_PLUS]: 3.5,
    [Grade.B]: 3.0,
    [Grade.C_PLUS]: 2.5,
    [Grade.C]: 2.0,
    [Grade.D_PLUS]: 1.5,
    [Grade.D]: 1.0,
    [Grade.F]: 0.0,
  };
  return points[grade] ?? 0;
}

export function calculateGPAX(records: { ca: number; cs: number; gp: number }[]) {
  const totalCA = records.reduce((sum, r) => sum + r.ca, 0);
  const totalCS = records.reduce((sum, r) => sum + r.cs, 0);
  const totalGP = records.reduce((sum, r) => sum + r.gp, 0);
  const gpax = totalCA > 0 ? parseFloat((totalGP / totalCA).toFixed(2)) : 0;

  return { gpax, totalCA, totalCS, totalGP };
}
