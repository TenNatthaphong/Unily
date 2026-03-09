import "dotenv/config";
import { PrismaClient, CourseCategory } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from 'fs';
import * as path from 'path';

// 1. ตั้งค่าการเชื่อมต่อผ่าน pg Pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. สร้าง PrismaClient โดยใช้ Adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Seeding Process (with Native Adapter)...');

  // อ่านไฟล์ JSON
  const filePath = path.join(__dirname, 'courses.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ Error: courses.json not found at ${filePath}`);
  }
  
  const coursesData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`📊 Found ${coursesData.length} courses in JSON.`);

  // 3. ขั้นตอนการ Upsert รายวิชา
  console.log('⏳ Upserting Courses...');
  for (const item of coursesData) {
    const cleanNameTh = item.nameTh.split(/\s\d\(/)[0].trim();

    await prisma.course.upsert({
      where: { id: item.id },
      update: {
        nameTh: cleanNameTh,
        nameEn: item.nameEn || '',
        credits: item.credits,
        lectureHours: item.lectureHours,
        labHours: item.labHours,
        selfStudyHours: item.selfStudyHours,
        category: item.category as CourseCategory,
      },
      create: {
        id: item.id,
        nameTh: cleanNameTh,
        nameEn: item.nameEn || '',
        credits: item.credits,
        lectureHours: item.lectureHours,
        labHours: item.labHours,
        selfStudyHours: item.selfStudyHours,
        category: item.category as CourseCategory,
        maxEntryYear: 99,
      },
    });
  }

  // 4. เชื่อมความสัมพันธ์ Prerequisite
  console.log('🔗 Connecting Prerequisites...');
  for (const item of coursesData) {
    if (item.prerequisites && Array.isArray(item.prerequisites)) {
      for (const preId of item.prerequisites) {
        try {
          await prisma.prerequisite.upsert({
            where: {
              courseId_preCourseId: {
                courseId: item.id,
                preCourseId: preId,
              },
            },
            update: {},
            create: {
              courseId: item.id,
              preCourseId: preId,
            },
          });
        } catch (error) {
          console.warn(`⚠️ Warning: Could not connect ${preId} for ${item.id}`);
        }
      }
    }
  }

  console.log('🚀 Seeding Completed Successfully!');
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