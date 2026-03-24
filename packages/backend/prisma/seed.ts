import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Seeding Process (Infrastructure Only)...');

  // 1. Load Data จากไฟล์ JSON
  const facDeptData = JSON.parse(fs.readFileSync(path.join(__dirname, 'facNdept.json'), 'utf-8')).faculties;
  const coursesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'courses.json'), 'utf-8'));
  const curriculumData = JSON.parse(fs.readFileSync(path.join(__dirname, 'curriculum.json'), 'utf-8'));

  const facultyMap = new Map<string, string>(); // [facultyCode]: uuid
  const deptMap = new Map<string, string>();    // [facCode-deptCode]: uuid
  const courseCodeToUuid = new Map<string, string>(); // [courseCode]: uuid

  // --- STEP 1: Faculty & Department ---
  console.log('📦 Seeding Faculties and Departments...');
  for (const f of facDeptData) {
    const faculty = await prisma.faculty.upsert({
      where: { facultyCode: f.facultyCode },
      update: { nameTh: f.nameTh, nameEn: f.nameEn },
      create: { 
        facultyCode: f.facultyCode, 
        nameTh: f.nameTh, 
        nameEn: f.nameEn 
      }
    });
    facultyMap.set(f.facultyCode, faculty.id);

    for (const d of f.departments) {
      await prisma.department.upsert({
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
      const dept = await prisma.department.findUnique({
          where: { facultyId_deptCode: { facultyId: faculty.id, deptCode: d.deptCode } }
      });
      if (dept) deptMap.set(`${f.facultyCode}-${d.deptCode}`, dept.id);
    }
  }

  // --- STEP 2: Courses ---
  console.log('📚 Seeding Courses...');
  for (const item of coursesData) {
    const realFacultyUuid = facultyMap.get(item.facultyId);
    const realDeptUuid = deptMap.get(`${item.facultyId}-${item.deptId}`);

    if (!realFacultyUuid || !realDeptUuid) continue;

    const course = await prisma.course.upsert({
      where: { courseCode: item.code },
      update: {
        nameTh: item.nameTh.split(/\s\d\(/)[0].trim(),
        nameEn: item.nameEn || '',
        credits: item.credits,
        facultyId: realFacultyUuid,
        deptId: realDeptUuid,
        category: item.category,
        isWildcard: item.isWildcard || false
      },
      create: {
        courseCode: item.code,
        nameTh: item.nameTh.split(/\s\d\(/)[0].trim(),
        nameEn: item.nameEn || '',
        credits: item.credits,
        lectureHours: item.lectureHours || 0,
        labHours: item.labHours || 0,
        selfStudyHours: item.selfStudyHours || 0,
        facultyId: realFacultyUuid,
        deptId: realDeptUuid,
        category: item.category,
        isWildcard: item.isWildcard || false
      },
    });
    courseCodeToUuid.set(item.code, course.id);
  }

  // --- STEP 3: Prerequisites ---
  console.log('🔗 Seeding Prerequisites...');
  for (const item of coursesData) {
    const currentUuid = courseCodeToUuid.get(item.code);
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

  // --- STEP 4: Curriculums ---
  console.log('🗺️ Seeding Curriculums...');
  for (const curr of curriculumData) {
    // สมมติว่าเป็นของคณะวิทยาศาสตร์ (04) สาขาวิทยาการคอมพิวเตอร์ (06)
    const facultyId = facultyMap.get('04');
    const deptId = deptMap.get('04-06');

    if (!facultyId || !deptId) {
      console.warn(`⚠️ Skipped curriculum ${curr.curriculumCode}: Faculty/Dept not found`);
      continue;
    }

    const curriculum = await prisma.curriculum.upsert({
      where: { curriculumCode: curr.curriculumCode },
      update: {
        name: curr.name,
        year: curr.year,
        totalCredits: curr.totalCredits,
        note: curr.note,
        facultyId,
        deptId
      },
      create: {
        curriculumCode: curr.curriculumCode,
        name: curr.name,
        year: curr.year,
        totalCredits: curr.totalCredits,
        note: curr.note,
        facultyId,
        deptId
      }
    });

    // Seed CurriculumCourses
    if (curr.courses) {
      for (const cc of curr.courses) {
        const courseId = courseCodeToUuid.get(cc.code);
        if (!courseId) {
          console.warn(`   ⚠️ Course ${cc.code} not found, skipping for curriculum ${curr.curriculumCode}`);
          continue;
        }

        await prisma.curriculumCourse.upsert({
          where: {
            curriculumId_positionX_positionY: {
              curriculumId: curriculum.id,
              positionX: cc.x,
              positionY: cc.y
            }
          },
          update: {
            courseId: courseId,
            year: cc.year,
            semester: cc.semester,
            mappingPattern: cc.pattern || null
          },
          create: {
            curriculumId: curriculum.id,
            courseId: courseId,
            year: cc.year,
            semester: cc.semester,
            positionX: cc.x,
            positionY: cc.y,
            mappingPattern: cc.pattern || null
          }
        });
      }
    }
  }
  // --- STEP 5: Professors ---
  console.log('👨‍🏫 Seeding Professors...');
  const professorsData = [
    { firstName: "ธรนภัทร์", lastName: "อนุศาสน์อมรกุล" },
    { firstName: "ลือพล", lastName: "พิพานเมฆาภรณ์" },
    { firstName: "นิกร", lastName: "สุทธิเสงี่ยม" },
    { firstName: "คันธารัตน์", lastName: "อเนกบุณย์" },
    { firstName: "อภิสิทธิ์", lastName: "รัตนาตรานุรักษ์" },
    { firstName: "สรร", lastName: "รัตนสัญญา" },
    { firstName: "นนทกร", lastName: "สถิตานนท์" },
    { firstName: "กฤดาภัทร", lastName: "สีหารี" },
    { firstName: "กอบเกียรติ", lastName: "สระอุบล" },
    { firstName: "ปรวัฒน์", lastName: "วิสูตรศักดิ์" },
    { firstName: "เบญจพร", lastName: "ลิ้มรรรมาภรณ์" },
    { firstName: "อัครา", lastName: "ประโยชน์" },
    { firstName: "สุวัจชัย", lastName: "กมลสันติโรจน์" },
    { firstName: "ปรัชญาพร", lastName: "เลี้ยงสุทธิสกนธ์" },
    { firstName: "เฉียบวุฒิ", lastName: "รัตนวิไลสกุล" },
    { firstName: "ณัฐวุฒิ", lastName: "สร้อยดอกสน" },
    { firstName: "อนุสรณ์", lastName: "วงษ์สนิท" },
    { firstName: "ยนต์ชนก", lastName: "เขาแก้ว" },
    { firstName: "สถิตย์", lastName: "ประสมพันธ์" },
    { firstName: "รรรศฎภณ", lastName: "สุระศักดิ์" },
    { firstName: "เอิญ", lastName: "สุริยะฉาย" },
    { firstName: "ณัฐกิตติ์", lastName: "จิตรเอื้อตระกูล" },
    { firstName: "จิรายุ", lastName: "เสมกันทา" }
  ];

  const csFacultyId = facultyMap.get('04');
  const csDeptId = deptMap.get('04-06');

  if (csFacultyId && csDeptId) {
    const profPassword = await bcrypt.hash("professor12345", 10);
    for (let i = 0; i < professorsData.length; i++) {
      const prof = professorsData[i];
      const email = `professor${i + 1}@unily.ac.th`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: profPassword,
          firstName: prof.firstName,
          lastName: prof.lastName,
          role: "PROFESSOR",
          status: "ACTIVE"
        }
      });

      await prisma.professorProfile.upsert({
        where: { userId: user.id },
        update: {
          facultyId: csFacultyId,
          deptId: csDeptId
        },
        create: {
          userId: user.id,
          facultyId: csFacultyId,
          deptId: csDeptId
        }
      });
    }
  } else {
    console.warn('⚠️ Cannot seed professors: CS Faculty (04) or Dept (06) not found.');
  }

  // --- STEP 6: Student Profiles ---
  console.log('🎓 Seeding 500 Students (Years 1-4)...');

  const thaiFirstNames = [
    "กิตติภพ", "ธนัชชา", "ปิยบุตร", "วรัญญา", "ชลสิทธิ์", "ณัฐพงศ์", "ทศพล", "นรินทร์", "เบญจมาศ", "ปกรณ์",
    "พรพิมล", "มงคล", "ยุทธนา", "รพีพรรณ", "ศิริชัย", "อภิชาติ", "กมลวรรณ", "ขวัญชัย", "จตุพร", "ฉัตรชัย",
    "ชยานนท์", "ญาณิศา", "ฐิติมา", "ณรงค์เดช", "ดนัย", "ทรงพล", "นันทวัฒน์", "บวร", "ปวริศา", "พงศธร",
    "พัชราภา", "พีรพล", "ภานุพงศ์", "มณีนุช", "ยุวดี", "รัตนา", "วรวุฒิ", "ศรัณย์", "สมชาย", "อนันต์",
    "กฤษฎา", "จิราพร", "ชลลดา", "ณิชา", "ธรรศ", "นรากร", "ปิยมาศ", "พงศ์พัศ", "รวิศ", "สิรินทร์",
    "อัครพล", "กิตติมา", "จารุพงศ์", "ชูเกียรติ", "ณัฐธิดา", "ทวีศักดิ์", "นพดล", "บุญส่ง", "ประเสริฐ", "พิชิต",
    "ไพศาล", "มนตรี", "เยาวลักษณ์", "รุ่งโรจน์", "ศตวรรษ", "สมพงษ์", "อาทิตย์", "กัญญารัตน์", "เจษฎา", "โชคชัย",
    "ดวงพร", "ธวัฒน์", "นพรัตน์", "ปิยะนันท์", "พรชัย", "พิยดา", "รังสิมันต์", "ศิริพร", "สมเกียรติ", "อำนาจ",
    "เกียรติศักดิ์", "จตุรนต์", "ชลธิชา", "ณฐพล", "ธนกร", "นภัสสร", "ปฏิพาน", "พรเทพ", "พิมลพรรณ", "ระวี",
    "ศักดิ์ดา", "สุรชัย", "อดิศร", "กมลลักษณ์", "จิรวัฒน์", "ชัชวาล", "ณหทัย", "ธนภูมิ", "นรินทร์", "ปวีณา"
  ];
  const thaiLastNames = [
    "รัตนโชติ", "แสงสว่าง", "เอื้อเฟื้อ", "ปรีดากุล", "ดีเลิศ", "พงษ์สุวรรณ", "เจริญผล", "รัตนวิจิตร", "งามขำ", "มณีรัตน์",
    "สวัสดิ์ดี", "ทองคำ", "รุ่งเรือง", "ปัญญาดี", "สุวรรณรัตน์", "ศิริโชติ", "บุญมี", "พาณิชย์", "วงศ์สวัสดิ์", "ธรรมะ",
    "เลิศล้ำ", "จิตต์มั่น", "อัครเดชา", "คงกระพัน", "นิมิตรา", "วรโชติ", "เกียรติขจร", "เดชาศิลป์", "นราภิรมย์", "ทิพย์มาศ",
    "เมธาภัทร", "อนันตสุข", "จิรภาคย์", "ศรีสุวรรณ", "แก้วมณี", "ชัยชนะ", "ปัญญามี", "พิพัฒน์ผล", "รุ่งนภา", "วรากุล",
    "วิจิตรศิลป์", "ศุภกิจ", "อนันตชัย", "กิตติสกุล", "ขจรเดช", "จตุรพักตร์", "ชินบุตร", "ณัฐกร", "ตระกูลว่อง", "ทวีโชค",
    "นันทศิลป์", "บริบูรณ์", "ปวริศร", "พงษ์สวัสดิ์", "พิชัยนาวิน", "รัตนศิลป์", "เลิศวิจิตร", "วนิชชา", "ศิริวัฒน์", "สุขสันต์",
    "อดุลยเดช", "โอฬารวิจิตร", "กาญจนวิทย์", "จรูญศิลป์", "ชโลธร", "ณรงค์วิทย์", "ธนปัญญา", "นฤมล", "ประสิทธิผล", "พิทักษ์",
    "ภักดีศิริ", "ยอดเยี่ยม", "วัฒนศิลป์", "ศิรินทร์", "สมบูรณ์", "หิรัญพงศ์", "อัศวเดช", "กอบโชค", "จิตติพล", "ชัยรัตน์",
    "โชคพิสิษฐ์", "ฐิติวัฒน์", "ทิพยากร", "นันทนา", "ปิยมาศ", "พรหมสุวรรณ", "ไพโรจน์", "รุ่งอนันต์", "ศรีวิไล", "สุทธิพงศ์",
    "อดิศักดิ์", "อมรศิลป์", "เก่งกาจ", "คงเจริญ", "ชาญชัย", "ณัฐวรรณ", "ธราธร", "นพนันท์", "ประชานิยม", "พรรณราย"
  ];

  if (csFacultyId && csDeptId) {
    const csRegCurric = await prisma.curriculum.findUnique({
      where: { curriculumCode: 'CS64-REGULAR' }
    });
    
    if (!csRegCurric) {
      console.warn('⚠️ Skipping student seeding: Curriculum CS64-REGULAR not found.');
      return;
    }

    const curricId = csRegCurric.id;
    const yearsConfig = [
      { prefix: "68", count: 200 }, // ปี 1
      { prefix: "67", count: 150 }, // ปี 2
      { prefix: "66", count: 100 }, // ปี 3
      { prefix: "65", count: 50 }   // ปี 4
    ];

    for (const config of yearsConfig) {
      for (let i = 1; i <= config.count; i++) {
        const suffix = i.toString().padStart(5, '0');
        const stdId = `${config.prefix}0406${suffix}`;
        
        const fName = thaiFirstNames[i % thaiFirstNames.length];
        const lName = thaiLastNames[(i + 50) % thaiLastNames.length];
        
        const email = `u${stdId}@unily.ac.th`;
        // เพื่อความเร็วในการ Seed แนะนำให้ใช้รหัสผ่าน Plain text หรือ Hash ครั้งเดียวแล้วใช้ซ้ำ 
        // แต่ถ้าต้องการแยกกันก็ตามนี้ครับ:
        const hashPassword = await bcrypt.hash(`unily${stdId}`, 10);
      
        if (i % 50 === 0) console.log(`      ... ${i}/${config.count} students seeded for Batch ${config.prefix}`);
        // 1. จัดการข้อมูล User
        const user = await prisma.user.upsert({
          where: { email },
          update: {}, // ถ้ามีแล้วไม่แก้ไขอะไร
          create: {
            email,
            password: hashPassword,
            firstName: fName,
            lastName: lName,
            role: "STUDENT",
            status: "ACTIVE"
          }
        });

        // 2. จัดการข้อมูล StudentProfile (ใช้ชื่อฟิลด์ตาม Schema ล่าสุด)
        await prisma.studentProfile.upsert({
          where: { userId: user.id },
          update: {
            facultyId: csFacultyId,
            deptId: csDeptId,
            curriculumId: curricId,
          },
          create: {
              userId: user.id, // Primary Key คือ userId (Uuid)
              studentCode: stdId,
              curriculumId: curricId,
              facultyId: csFacultyId,
              deptId: csDeptId,
              entryYear: 2500 + Number(config.prefix), // เช่น 2565
              year: 2568 - (2500 + Number(config.prefix)) + 1, // คำนวณชั้นปี ณ ปีปัจจุบัน (2568)
              status: "STUDYING",
              gpax: 0.0, // ตาม Schema คือ gpax
              ca: 0,    // ตาม Schema คือ ca (Credits Attempted)
              cs: 0,    // ตาม Schema คือ cs (Credits Sum/Passed)
          },
        });
      }
    }
    console.log('✅ 500 Students seeded successfully!');
  } else {
    console.warn('⚠️ Cannot seed students: CS Faculty (04) or Dept (06) not found.');
  }
  console.log('🚀 Infrastructure Seeded Successfully!');
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