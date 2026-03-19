// API client for curriculum editor - connects to Supabase Edge Functions
import { projectId, publicAnonKey } from "@/app/admin/components/mock-data";
import type { Course, CurriculumCourse, Prerequisite } from "@/app/admin/components/mock-data";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-105269f1/curriculum`;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

// Seed initial data into KV store (idempotent)
export async function seedCurriculum(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/seed`, { method: 'POST', headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Seed failed: ${err.error ?? res.statusText}`);
  }
  return res.json();
}

// Fetch all courses
export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${BASE_URL}/courses`, { headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Fetch courses failed: ${err.error ?? res.statusText}`);
  }
  const data = await res.json();
  return data.courses ?? [];
}

// Fetch all prerequisites
export async function fetchPrerequisites(): Promise<Prerequisite[]> {
  const res = await fetch(`${BASE_URL}/prerequisites`, { headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Fetch prerequisites failed: ${err.error ?? res.statusText}`);
  }
  const data = await res.json();
  return data.prerequisites ?? [];
}

// Fetch curriculum courses
export async function fetchCurriculumCourses(): Promise<CurriculumCourse[]> {
  const res = await fetch(`${BASE_URL}/curriculum-courses`, { headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Fetch curriculum courses failed: ${err.error ?? res.statusText}`);
  }
  const data = await res.json();
  return data.curriculumCourses ?? [];
}

// Batch update curriculum courses
export async function batchUpdateCurriculumCourses(
  curriculumCourses: CurriculumCourse[]
): Promise<{ status: string; count: number }> {
  const res = await fetch(`${BASE_URL}/batch-update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ curriculumCourses }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Batch update failed: ${err.error ?? res.statusText}`);
  }
  return res.json();
}

// Reset curriculum to default seed data
export async function resetCurriculum(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/reset`, { method: 'POST', headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Reset failed: ${err.error ?? res.statusText}`);
  }
  return res.json();
}

// Fetch all data at once (used on page load)
export async function fetchAllCurriculumData(): Promise<{
  courses: Course[];
  prerequisites: Prerequisite[];
  curriculumCourses: CurriculumCourse[];
}> {
  // Seed first (idempotent), then fetch all in parallel
  await seedCurriculum();
  const [courses, prerequisites, curriculumCourses] = await Promise.all([
    fetchCourses(),
    fetchPrerequisites(),
    fetchCurriculumCourses(),
  ]);
  return { courses, prerequisites, curriculumCourses };
}
