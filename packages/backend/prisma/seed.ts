import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
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
    for (let i = 0; i < professorsData.length; i++) {
      const prof = professorsData[i];
      const email = `professor${i + 1}@unily.ac.th`;
      const hashPassword = await bcrypt.hash("professor12345", 10);
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashPassword,
          firstName: prof.firstName,
          lastName: prof.lastName,
          role: "PROFESSOR", // หรือ Enum ของคุณ
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
    "กวิน","กัญญา","กาญจนา","กิตติภพ","กิตติพล","กิตติมา","เกษม","กฤษฎา","กฤษณ์","กมลวรรณ",
    "ขนิษฐา","ขวัญชัย","เขมจิรา","คชาธาร","คันธารัตน์","จักรกฤษณ์","จักรพร","จันทร์จิรา","จารุณี","จารุพงศ์",
    "จิตสุภา","จิราพร","จิรายุ","จตุพร","ชนิดา","ชนินทร","ชยพล","ชยานนท์","ชลลดา","ชลสิทธิ์",
    "ชลธิชา","ชัยณรงค์","ชาคริต","ชานนท์","ชิตพล","ชูเกียรติ","เชษฐา","โชติกา","ญาณณัฐ","ญาณิศา",
    "ณปภัช","ณภัทร","ณรงค์วุฒิ","ณฐพล","ณหทัย","ณัฐกิตติ์","ณัฐชน","ณัฐณิชา","ณัฐธิดา","ณัฐนิช",
    "ณัฐพงศ์","ณัฐพัชร์","ณัฐภณ","ณัฐวรรณ","ณัฐสิทธิ์","ดนัย","ดนัยพัฒน์","ดวงพร","ถิรเดช","ทรงพล",
    "ทรรศนีย์","ทวีศักดิ์","ทศพล","ทัตพิชา","ทิตยา","เทวินทร์","ธนกร","ธนชัย","ธนพร","ธนภัทร",
    "ธนภูมิ","ธนวัฒน์","ธนัชชา","ธนัชพร","ธนันต์","ธนาพร","ธรรศ","ธวัฒน์","ธัชพล","ธัญชนิต",
    "นครินทร์","นพดล","นพรัตน์","นภัสสร","นภาพรรณ","นรากร","นรินทร์","นรเศรษฐ์","นราพร","นราวิชญ์",
    "นลินรัตน์","นวพล","นันทวัฒน์","นาวิน","นิตยา","นิธิ","นิพนธ์","นิพัทธ์","นิภา","นิษฐา",
    "บดินทร์","บวร","บุญส่ง","บุษกร","ปกรณ์","ปฏิพาน","ปภาวรินทร์","ปวริศา","ปวีณา","ปิยบุตร",
    "ปิยมาศ","ปิยะนันท์","พงศ์พัศ","พงศธร","พชรพล","พรชัย","พรนิภา","พรพิมล","พรเทพ","พลอยไพลิน",
    "พัชราภา","พัทธนันท์","พิชิต","พิทยา","พิพัฒน์","พิมลพรรณ","พิยดา","พิรุฬห์","พิศิษฐ์","พีรพล",
    "ภคพล","ภทรพล","ภัทรพล","ภานุพงศ์","ภาวิณี","ภูชิต","ภูดิท","ภูเบศร์","มณีนุช","มนตรี",
    "มลฤดี","มัลลิกา","มงคล","ยนต์ชนก","ยุทธนา","ยุวดี","รพีพรรณ","รวิศ","รังสิมันต์","ระวี",
    "รัตนา","รุ่งโรจน์","วรรณวิมล","วรวุฒิ","วรัญญา","วรินทร","ศกุนตลา","ศรัณย์","ศักดิ์ดา","ศิริชัย",
    "ศิริพร","ศิริรัตน์","ศตวรรษ","ศุภกร","สมชาย","สมพงษ์","สมเกียรติ","สิรินทร์","สิรินภา","สิรีธร",
    "สุรชัย","สุรินทร์","สุวิชา","อดิศร","อดิศักดิ์","อธิป","อนันต์","อนาวิน","อนุชา","อนุสรณ์",
    "อภิชาติ","อภิเษก","อมรรัตน์","อรุณ","อลิสา","อำนาจ","อาทิตย์","อาภา","เอกพล","เอกรัตน์",
    "กัญญารัตน์","เจษฎา","โชคชัย","ณิชา","ธรรม์ธันย์","นันทิกา","ปฏิภาณ","พีระวัฒน์","ภาสกร","วัชรพล"
  ];
  const thaiLastNames = [
    "รัตนโชติ","แสงสว่าง","เอื้อเฟื้อ","ปรีดากุล","ดีเลิศ","พงษ์สุวรรณ","เจริญผล","รัตนวิจิตร","งามขำ","มณีรัตน์",
    "สวัสดิ์ดี","ทองคำ","รุ่งเรือง","ปัญญาดี","สุวรรณรัตน์","ศิริโชติ","บุญมี","พาณิชย์","วงศ์สวัสดิ์","ธรรมะ",
    "เลิศล้ำ","จิตต์มั่น","อัครเดชา","คงกระพัน","นิมิตรา","วรโชติ","เกียรติขจร","เดชาศิลป์","นราภิรมย์","ทิพย์มาศ",
    "เมธาภัทร","อนันตสุข","จิรภาคย์","ศรีสุวรรณ","แก้วมณี","ชัยชนะ","ปัญญามี","พิพัฒน์ผล","รุ่งนภา","วรากุล",
    "วิจิตรศิลป์","ศุภกิจ","อนันตชัย","กิตติสกุล","ขจรเดช","จตุรพักตร์","ชินบุตร","ณัฐกร","ตระกูลว่อง","ทวีโชค",
    "นันทศิลป์","บริบูรณ์","ปวริศร","พงษ์สวัสดิ์","พิชัยนาวิน","รัตนศิลป์","เลิศวิจิตร","วนิชชา","ศิริวัฒน์","สุขสันต์",
    "อดุลยเดช","โอฬารวิจิตร","กาญจนวิทย์","จรูญศิลป์","ชโลธร","ณรงค์วิทย์","ธนปัญญา","นฤมล","ประสิทธิผล","พิทักษ์",
    "ภักดีศิริ","ยอดเยี่ยม","วัฒนศิลป์","ศิรินทร์","สมบูรณ์","หิรัญพงศ์","อัศวเดช","กอบโชค","จิตติพล","ชัยรัตน์",
    "โชคพิสิษฐ์","ฐิติวัฒน์","ทิพยากร","นันทนา","พรหมสุวรรณ","ไพโรจน์","รุ่งอนันต์","ศรีวิไล","สุทธิพงศ์","อดิศักดิ์",
    "อมรศิลป์","เก่งกาจ","คงเจริญ","ชาญชัย","ณัฐวรรณ","ธราธร","นพนันท์","ประชานิยม","พรรณราย","สายทอง",
    "สิทธิเดช","สุขเกษม","อ่อนน้อม","อุตสาหกรรม","กาญจนา","เจริญรัตน์","ชวลิต","ดาราวดี","ทองสุข","นิรันดร์",
    "บุญเรือง","ประสาร","พงศ์วัฒนา","มาลาวรรณ","รัตนพันธ์","วงษ์ทอง","ศรีทอง","สิทธิโชค","แสนดี","อุทัยรัตน์",
    "เจริญสุข","ใจดี","ดีมาก","ทองพูล","นิลรัตน์","พรมสิทธิ์","มั่นคง","รัตนวงศ์","วิชัยดิษฐ","สาระ",
    "สุวรรณภูมิ","หาญกล้า","อัมพร","กล้าหาญ","จันทรวิภา","ชัยสิทธิ์","ทองแก้ว","นิราศ","โภคทรัพย์","ยิ่งยง",
    "ราชสมบัติ","วิเชียร","ศรีบุตร","สงวน","อ่อนละมุน","อาจหาญ","เขียวดี","โชติช่วง","ดุสิต","ทองเจือ",
    "นิยม","บุตรดา","พัฒน์","มีชัย","รัตนกูล","วัฒนาการ","ศิลปกิจ","สมัคร","อติพล","เหมือนสวรรค์",
    "โกศล","ช่วยชาติ","ดิเรก","ทองปาน","นิรุต","บำรุงชาติ","พลายงาม","ยาวิชัย","รุ่งเรืองกิจ","วิทยากร",
    "สกุลดี","หวังดี","อาคม","เจนจบ","ชำนาญ","ดำรงค์","ทิพวรรณ","นิมมาน","บริสุทธิ์","พิสิษฐ์",
    "มนัสวี","ยืนยง","วิไลลักษณ์","ศรีสุข","สดใส","หาญณรงค์","อโนทัย","แจ่มจรัส","เชี่ยวชาญ","ดลชัย",
    "ทวีสุข","นิรมิต","บุญญาพร","พิทักษ์สิน","ยิ่งสถาพร","รัตนไชย","วงศ์จินดา","สิทธิพงศ์","อัคนีย์","เพชรงาม"
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
      { prefix: "69", count: 200 }, // ปี 1 (รุ่น 2569)
      { prefix: "68", count: 200 }, // ปี 2
      { prefix: "67", count: 150 }, // ปี 3
      { prefix: "66", count: 100 }, // ปี 4
      { prefix: "65", count: 50 }   // ปี 5 (รุ่นเก่า)
    ];

    for (const config of yearsConfig) {
      for (let i = 1; i <= config.count; i++) {
        const suffix = i.toString().padStart(5, '0');
        const stdId = `${config.prefix}0406${suffix}`;
        
        const fName = thaiFirstNames[Math.floor(Math.random() * thaiFirstNames.length)];
        const lName = thaiLastNames[Math.floor(Math.random() * thaiLastNames.length)];
        
        const email = `u${stdId}@unily.ac.th`;
        // เพื่อความเร็วในการ Seed แนะนำให้ใช้รหัสผ่าน Plain text หรือ Hash ครั้งเดียวแล้วใช้ซ้ำ 
        // แต่ถ้าต้องการแยกกันก็ตามนี้ครับ:
        const hashPassword = await bcrypt.hash(`unily${stdId}`, 10);
      
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
              year: Math.max(1, 2569 - (2500 + Number(config.prefix)) + 1), // คำนวณชั้นปี ณ ปีปัจจุบัน (2569)
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