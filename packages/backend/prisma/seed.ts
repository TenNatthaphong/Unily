import "dotenv/config";
import { PrismaClient, CourseCategory } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Seeding Process (Auto-ID Generation)...');

  // 1. Load Data
  const facDeptData = JSON.parse(fs.readFileSync(path.join(__dirname, 'facNdept.json'), 'utf-8')).faculties;
  const coursesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'courses.json'), 'utf-8'));

  const facultyMap = new Map<string, string>(); // [facultyCode]: uuid
  const deptMap = new Map<string, string>();    // [facCode-deptCode]: uuid
  const courseCodeToUuid = new Map<string, string>(); // [courseCode]: uuid

  // --- STEP 1: Faculty & Department ---
  for (const f of facDeptData) {
    const faculty = await prisma.faculty.upsert({
      where: { facultyCode: f.facultyCode },
      update: { nameTh: f.nameTh, nameEn: f.nameEn },
      create: { 
        facultyCode: f.facultyCode, 
        nameTh: f.nameTh, 
        nameEn: f.nameEn 
        // ไม่ต้องส่ง id: ให้ DB เจนเอง
      }
    });
    facultyMap.set(f.facultyCode, faculty.id);

    for (const d of f.departments) {
      const dept = await prisma.department.upsert({
        where: { 
          facultyId_deptCode: { facultyId: faculty.id, deptCode: d.deptCode } 
        },
        update: { shortName: d.shortName, nameTh: d.nameTh, nameEn: d.nameEn },
        create: { 
          deptCode: d.deptCode, 
          facultyCode: f.facultyCode,
          shortName: d.shortName, 
          nameTh: d.nameTh, 
          nameEn: d.nameEn, 
          facultyId: faculty.id 
        }
      });
      deptMap.set(`${f.facultyCode}-${d.deptCode}`, dept.id);
    }
  }

  // --- STEP 2: Courses ---
  for (const item of coursesData) {
    const realFacultyUuid = facultyMap.get(item.facultyId);
    const realDeptUuid = deptMap.get(`${item.facultyId}-${item.deptId}`);

    if (!realFacultyUuid || !realDeptUuid) continue;

    const course = await prisma.course.upsert({
      where: { courseCode: item.id }, // item.id ใน JSON คือรหัสวิชา เช่น '040613101'
      update: {
        nameTh: item.nameTh.split(/\s\d\(/)[0].trim(),
        nameEn: item.nameEn || '',
        credits: item.credits,
        facultyId: realFacultyUuid,
        deptId: realDeptUuid,
      },
      create: {
        courseCode: item.id, // เก็บ รหัสวิชา ลงใน courseCode แทน id
        nameTh: item.nameTh.split(/\s\d\(/)[0].trim(),
        nameEn: item.nameEn || '',
        credits: item.credits,
        lectureHours: item.lectureHours,
        labHours: item.labHours,
        selfStudyHours: item.selfStudyHours,
        facultyId: realFacultyUuid,
        deptId: realDeptUuid,
        // id จะถูกเจนอัตโนมัติเป็น UUID
      },
    });
    courseCodeToUuid.set(item.id, course.id);
  }

  // --- STEP 3: Prerequisites ---
  for (const item of coursesData) {
    const currentUuid = courseCodeToUuid.get(item.id);
    if (!currentUuid || !item.prerequisites) continue;

    for (const preCode of item.prerequisites) {
      const preUuid = courseCodeToUuid.get(preCode);
      if (preUuid) {
        await prisma.prerequisite.upsert({
          where: {
            courseId_requiresCourseId: {
              courseId: currentUuid,
              requiresCourseId: preUuid,
            },
          },
          update: {},
          create: {
            courseId: currentUuid,
            requiresCourseId: preUuid,
          },
        });
      }
    }
  }

  console.log('🚀 Seeding Completed with Auto-generated UUIDs!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Seeding Error:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });