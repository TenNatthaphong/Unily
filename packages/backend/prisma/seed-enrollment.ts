import "dotenv/config";
import { PrismaClient, Grade, DayOfWeek, StudentStatus, EnrollmentStatus } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// --- Configurations ---
// 10 วิชาเกณฑ์ COOP ตามประกาศภาควิชา
const COOP_CRITERIA_COURSES = ["040613203", "040613205", "040613204", "040613302", "040613501", "040613306", "040613502", "040613301", "040613601", "040613701"];
// COOP course codes: pre-coop → coop1 → coop2
// pre-coop/coop1 F → revert กลับปกติ | coop2 F → ไม่ revert (วิชาท้าย chain)
const COOP_REVERT_CODES = ["040613130", "040613131"]; // F แล้ว revert
const COOP_COURSE_CODES = ["040613130", "040613131", "040613132"]; // ทั้ง chain (สำหรับ filter failedInTerm)
const TIME_SLOTS = {
    h2: [{ s: "09:00", e: "11:00" }, { s: "13:00", e: "15:00" }, { s: "15:00", e: "17:00" }],
    h3: [{ s: "09:00", e: "12:00" }, { s: "13:00", e: "16:00" }, { s: "17:00", e: "20:00" }],
    h4: [{ s: "08:30", e: "12:30" }, { s: "13:00", e: "17:00" }, { s: "17:00", e: "21:00" }]
};
const DAYS: DayOfWeek[] = [DayOfWeek.MON, DayOfWeek.TUE, DayOfWeek.WED, DayOfWeek.THU, DayOfWeek.FRI];

const GP_MAP: Record<string, number> = { A: 4.0, B_PLUS: 3.5, B: 3.0, C_PLUS: 2.5, C: 2.0, D_PLUS: 1.5, D: 1.0, F: 0.0 };

const calculateGrade = (total: number): Grade => {
    if (total < 40) return Grade.F;
    if (total <= 50) return Grade.D;
    if (total <= 60) return Grade.D_PLUS;
    if (total <= 65) return Grade.C;
    if (total <= 70) return Grade.C_PLUS;
    if (total <= 75) return Grade.B;
    if (total <= 80) return Grade.B_PLUS;
    return Grade.A;
};

// range 35-92 เกาะกลุ่ม 65-78 ประมาณ 35% | 79-92 ประมาณ 40% | 35-64 ประมาณ 25%
// avg GPA ≈ 2.85 → ~60% ผ่านเกณฑ์ COOP (GPA >= 2.75), F rate ≈ 4%
const getRandomTotal = (): number => {
    const r = Math.random();
    if (r < 0.35) return Math.floor(Math.random() * 14) + 65;  // 65-78
    if (r < 0.75) return Math.floor(Math.random() * 14) + 79;  // 79-92
    return Math.floor(Math.random() * 30) + 35;                 // 35-64
};

// split total เป็น midterm(40%) + final(60%) พร้อม noise เล็กน้อย
const splitScore = (total: number): { midterm: number; final: number } => {
    const base = total / 100;
    const midterm = parseFloat((base * 40 + (Math.random() * 4 - 2)).toFixed(1));
    const final   = parseFloat((total - midterm).toFixed(1));
    return { midterm: Math.max(0, midterm), final: Math.max(0, final) };
};

const getStartOfWeekOne = (month: number, year: number) => {
    const date = new Date(year - 543, month, 1);
    while (date.getDay() !== 1) date.setDate(date.getDate() + 1);
    date.setHours(8, 0, 0, 0);
    return date;
};

const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const isConflict = (s1S: string, s1E: string, s2S: string, s2E: string) => timeToMin(s1S) < timeToMin(s2E) && timeToMin(s1E) > timeToMin(s2S);

async function main() {
    console.log('\n🚀 [FINAL MASTER SEED: DIAGNOSTIC MODE]');
    console.time("⏱️  Total Execution Time");
    
    process.stdout.write('   🚀 Starting Enrollment Seed Process... \n');
    // Reset studentProfile ให้กลับค่าเริ่มต้น (กรณีรัน seed-enrollment ซ้ำโดยไม่ได้รัน seed ก่อน)
    const regularCurric = await prisma.curriculum.findUnique({ where: { curriculumCode: "CS64-REGULAR" } });
    if (regularCurric) {
        await prisma.studentProfile.updateMany({
            data: { year: 1, gpax: 0, ca: 0, cs: 0, status: StudentStatus.STUDYING, curriculumId: regularCurric.id }
        });
    }
    console.log('Done.');

    // Generate Batch 69 students (200 accounts)
    const batch69Exists = await prisma.studentProfile.findFirst({ where: { entryYear: 2569 } });
    if (!batch69Exists && regularCurric) {
        process.stdout.write('   🎓 Syncing 200 Students for Batch 69... ');
        const csFaculty = await prisma.faculty.findUnique({ where: { facultyCode: '04' } });
        const csDept = await prisma.department.findUnique({ where: { facultyId_deptCode: { facultyId: csFaculty!.id, deptCode: '06' } } });
        const sharedPassword = await bcrypt.hash("unily69", 10);
        for (let i = 1; i <= 200; i++) {
            if (i % 50 === 0) console.log(`      ... ${i}/200 student accounts created for Batch 69`);
            const studentCode = `690406${i.toString().padStart(5, '0')}`;
            const email = `u${studentCode}@unily.ac.th`;
            const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email, password: sharedPassword,
                    firstName: `Student69`, lastName: `No${i.toString().padStart(5, '0')}`,
                    role: 'STUDENT', status: 'ACTIVE'
                }
            });
            await prisma.studentProfile.upsert({
                where: { userId: user.id },
                update: { status: StudentStatus.STUDYING, year: 1, gpax: 0, ca: 0, cs: 0, entryYear: 2569, curriculumId: regularCurric.id },
                create: {
                    userId: user.id, studentCode, entryYear: 2569, year: 1,
                    facultyId: csFaculty!.id, deptId: csDept!.id, curriculumId: regularCurric.id,
                    status: StudentStatus.STUDYING, gpax: 0, ca: 0, cs: 0
                }
            });
        }
        console.log('Done.');
    }

    const allStudents = await prisma.studentProfile.findMany();
    let professors = await prisma.professorProfile.findMany();
    
    // Add 80 more professors if we have too few to prevent heavy overlaps
    if (professors.length < 100) {
        process.stdout.write('   👨‍🏫 Adding 80 more professors... ');
        const hash = await bcrypt.hash('password123', 10);
        const newProfs: any[] = [];
        const firstNames = [
            "กิตติภพ", "ธนัชชา", "ปิยบุตร", "วรัญญา", "ชลสิทธิ์", "ณัฐพงศ์", "ทศพล", "นรินทร์", "เบญจมาศ", "ปกรณ์",
            "พรพิมล", "มงคล", "ยุทธนา", "รพีพรรณ", "ศิริชัย", "อภิชาติ", "กมลวรรณ", "ขวัญชัย", "จตุพร", "ฉัตรชัย",
            "ชยานนท์", "ญาณิศา", "ฐิติมา", "ณรงค์เดช", "ดนัย", "ทรงพล", "นันทวัฒน์", "บวร", "ปวริศา", "พงศธร",
            "สมชาย", "สมพงษ์", "สมจิต", "อุไร", "จินตนา", "วันชัย", "วิเชียร", "ประสิทธิ์", "พรชัย", "มานะ",
            "มาลี", "ปราณี", "ประเสริฐ", "สมนึก", "สมคิด", "อนุชา", "เพ็ญศรี", "สมบูรณ์", "วิบูลย์", "อำนวย"
        ];
        const lastNames = [
            "รัตนโชติ", "แสงสว่าง", "เอื้อเฟื้อ", "ปรีดากุล", "ดีเลิศ", "พงษ์สุวรรณ", "เจริญผล", "รัตนวิจิตร", "งามขำ", "มณีรัตน์",
            "สวัสดิ์ดี", "ทองคำ", "รุ่งเรือง", "ปัญญาดี", "สุวรรณรัตน์", "ศิริโชติ", "บุญมี", "พาณิชย์", "วงศ์สวัสดิ์", "ธรรมะ",
            "แซ่ตั้ง", "ดีประเสริฐ", "ใจดี", "แซ่ลิ้ม", "ประเสริฐผล", "เจริญราษฎร์", "สุขุม", "มีทรัพย์", "ศรีสุข", "พิทักษ์",
            "โพธิ์แก้ว", "สุขสวัสดิ์", "ทรัพย์เจริญ", "บุญกอบ", "เจริญชัย", "สิงห์ทอง", "มั่นคง", "ชูศิลป์", "รักษา", "ชูชัย"
        ];
        for (let i = 0; i < 80; i++) {
            const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
            const email = `prof.bulk${i + 1}@unily.ac.th`;
            const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email, password: hash,
                    firstName: fname, lastName: lname + i,
                    role: 'PROFESSOR', status: 'ACTIVE'
                }
            });
            const profile = await prisma.professorProfile.upsert({
                where: { userId: user.id },
                update: {},
                create: { userId: user.id, facultyId: '04', deptId: '06' }
            });
            newProfs.push(profile);
        }
        professors.push(...newProfs);
        console.log('Done.');
    }

    let globalProfIndex = 0;

    const coopCurric = await prisma.curriculum.findUnique({ where: { curriculumCode: "CS64-COOP" } });
    const allCourses = await prisma.course.findMany();
    const allCurriculumCourses = await prisma.curriculumCourse.findMany({ include: { course: true } });
    // prerequisite map: courseId -> [requiresCourseId, ...]
    const allPrerequisites = await prisma.prerequisite.findMany();
    const prereqMap = new Map<string, string[]>();
    for (const p of allPrerequisites) {
        const list = prereqMap.get(p.courseId) || [];
        list.push(p.requiresCourseId);
        prereqMap.set(p.courseId, list);
    }
    
    // LOCKED BY CURRICULUM
    const curricIds = Array.from(new Set(allCurriculumCourses.map(c => c.curriculumId)));
    const lockedByCurric = new Map<string, Set<string>>();
    curricIds.forEach(cid => {
        lockedByCurric.set(cid, new Set(allCurriculumCourses.filter(c => c.curriculumId === cid && !c.mappingPattern).map(c => c.courseId)));
    });
    // รวม locked courses จากทุกหลักสูตร — ป้องกัน COOP student ลง Special Project / REGULAR student ลง COOP courses ผ่านช่อง elective
    const allLockedCourseIds = new Set<string>();
    for (const [, ids] of lockedByCurric) for (const id of ids) allLockedCourseIds.add(id);

    const requiredCoreFull = allCurriculumCourses.filter(c => !c.mappingPattern);

    const TARGET_YEAR = 2569;
    const TARGET_SEM = 1;

    // semester config dates (ISO string -> Date)
    const SEMESTER_DATES: Record<string, { regStart: Date; regEnd: Date; withdrawStart: Date; withdrawEnd: Date; isCurrent: boolean }> = {
        "2565-1": { regStart: new Date("2022-07-04T08:00:00+07:00"), regEnd: new Date("2022-07-18T16:00:00+07:00"), withdrawStart: new Date("2022-07-04T08:00:00+07:00"), withdrawEnd: new Date("2022-08-29T16:00:00+07:00"), isCurrent: false },
        "2565-2": { regStart: new Date("2022-11-07T08:00:00+07:00"), regEnd: new Date("2022-11-21T16:00:00+07:00"), withdrawStart: new Date("2022-11-07T08:00:00+07:00"), withdrawEnd: new Date("2023-01-02T16:00:00+07:00"), isCurrent: false },
        "2565-3": { regStart: new Date("2023-04-03T08:00:00+07:00"), regEnd: new Date("2023-04-10T16:00:00+07:00"), withdrawStart: new Date("2023-04-03T08:00:00+07:00"), withdrawEnd: new Date("2023-05-15T16:00:00+07:00"), isCurrent: false },
        "2566-1": { regStart: new Date("2023-07-03T08:00:00+07:00"), regEnd: new Date("2023-07-17T16:00:00+07:00"), withdrawStart: new Date("2023-07-03T08:00:00+07:00"), withdrawEnd: new Date("2023-08-28T16:00:00+07:00"), isCurrent: false },
        "2566-2": { regStart: new Date("2023-11-06T08:00:00+07:00"), regEnd: new Date("2023-11-20T16:00:00+07:00"), withdrawStart: new Date("2023-11-06T08:00:00+07:00"), withdrawEnd: new Date("2024-01-01T16:00:00+07:00"), isCurrent: false },
        "2566-3": { regStart: new Date("2024-04-01T08:00:00+07:00"), regEnd: new Date("2024-04-08T16:00:00+07:00"), withdrawStart: new Date("2024-04-01T08:00:00+07:00"), withdrawEnd: new Date("2024-05-13T16:00:00+07:00"), isCurrent: false },
        "2567-1": { regStart: new Date("2024-07-01T08:00:00+07:00"), regEnd: new Date("2024-07-15T16:00:00+07:00"), withdrawStart: new Date("2024-07-01T08:00:00+07:00"), withdrawEnd: new Date("2024-08-26T16:00:00+07:00"), isCurrent: false },
        "2567-2": { regStart: new Date("2024-11-04T08:00:00+07:00"), regEnd: new Date("2024-11-18T16:00:00+07:00"), withdrawStart: new Date("2024-11-04T08:00:00+07:00"), withdrawEnd: new Date("2024-12-30T16:00:00+07:00"), isCurrent: false },
        "2567-3": { regStart: new Date("2025-04-07T08:00:00+07:00"), regEnd: new Date("2025-04-14T16:00:00+07:00"), withdrawStart: new Date("2025-04-07T08:00:00+07:00"), withdrawEnd: new Date("2025-05-19T16:00:00+07:00"), isCurrent: false },
        "2568-1": { regStart: new Date("2025-07-07T08:00:00+07:00"), regEnd: new Date("2025-07-21T16:00:00+07:00"), withdrawStart: new Date("2025-07-07T08:00:00+07:00"), withdrawEnd: new Date("2025-09-01T16:00:00+07:00"), isCurrent: false },
        "2568-2": { regStart: new Date("2025-11-03T08:00:00+07:00"), regEnd: new Date("2025-11-17T16:00:00+07:00"), withdrawStart: new Date("2025-11-03T08:00:00+07:00"), withdrawEnd: new Date("2025-12-29T16:00:00+07:00"), isCurrent: false },
        "2568-3": { regStart: new Date("2026-04-06T08:00:00+07:00"), regEnd: new Date("2026-04-13T16:00:00+07:00"), withdrawStart: new Date("2026-04-06T08:00:00+07:00"), withdrawEnd: new Date("2026-05-18T16:00:00+07:00"), isCurrent: false },
        "2569-1": { regStart: new Date("2026-03-23T18:00:00+07:00"), regEnd: new Date("2026-04-07T09:00:00+07:00"), withdrawStart: new Date("2026-03-23T18:00:00+07:00"), withdrawEnd: new Date("2026-05-19T02:00:00+07:00"), isCurrent: true },
    };

    for (const year of [2565, 2566, 2567, 2568, 2569]) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━ Year: ${year} ━━━━━━━━━━━━━━━━━━━━━━━━`);
        for (const semester of [1, 2, 3]) {
            if (year === TARGET_YEAR && semester > TARGET_SEM) continue;
            const isLastOfAll = (year === TARGET_YEAR && semester === TARGET_SEM);

            process.stdout.write(`   🔹 Term ${semester}: `);
            const termTag = `[${year}/${semester}]`;
            console.time(termTag);

            await prisma.semesterConfig.updateMany({ data: { isCurrent: false } });
            const semDates = SEMESTER_DATES[`${year}-${semester}`];
            const activeSemester = await prisma.semesterConfig.create({
                data: { academicYear: year, semester, ...semDates }
            });
            // PHASE 1: SECTIONS
            const plannedCourses = allCurriculumCourses.filter(c => c.semester === activeSemester.semester);
            const processedKeys = new Set<string>();
            let sectionCountBefore = 0;

            for (const pc of plannedCourses) {
                const isWildcard = pc.course.isWildcard || !!pc.mappingPattern;
                const key = isWildcard ? (pc.mappingPattern || pc.course.courseCode) : pc.courseId;
                if (processedKeys.has(key as string)) continue;

                let targets: any[] = [];
                let nSec = 1, cap = 40;

                if (!isWildcard) {
                    targets = [pc.course];
                    const spCodes = ["040613130", "040613131", "040613132", "040613141", "040613142"];
                    const isSp = spCodes.includes(pc.course.courseCode);
                    nSec = isSp ? 1 : 10; cap = isSp ? 200 : 40;
                } else {
                    let p = pc.mappingPattern?.replace('%', '') || '';
                    if (p === "080303") p = "0803035";
                    const isCS = p === "0406", isSci = p === "04";

                    const matches = allCourses.filter(c => {
                        if (!c.courseCode.startsWith(p)) return false;
                        if (isSci && c.courseCode.startsWith("0406")) return false;
                        // Exclude locked core courses globally to prevent core courses filling elective slots
                        return !allLockedCourseIds.has(c.id);
                    });

                    targets = isCS ? matches.sort(() => 0.5 - Math.random()).slice(0, 30) : matches.sort(() => 0.5 - Math.random()).slice(0, 15);
                    nSec = isCS ? 2 : 3; cap = 30;
                }
                for (const tc of targets) {
                    // สร้าง day×slot combos ทั้งหมด แล้ว shuffle → กระจาย section ไม่ให้ซ้ำ slot
                    const hrs = (tc.lectureHours || 0) + (tc.labHours || 0);
                    const slotGrp = hrs >= 4 ? TIME_SLOTS.h4 : (hrs === 2 ? TIME_SLOTS.h2 : TIME_SLOTS.h3);
                    const combos: { day: DayOfWeek; s: string; e: string }[] = [];
                    for (const day of DAYS) for (const sl of slotGrp) combos.push({ day, s: sl.s, e: sl.e });
                    for (let i = combos.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [combos[i], combos[j]] = [combos[j], combos[i]]; }

                    for (let s = 1; s <= nSec; s++) {
                        const combo = combos[(s - 1) % combos.length]; // วน combos กระจายครบทุก slot
                        const sec = await prisma.section.create({
                            data: {
                                courseId: tc.id, professorId: professors[globalProfIndex++ % professors.length].userId,
                                academicYear: year, semester, sectionNo: s, capacity: cap, enrolledCount: 0
                            }
                        });
                        await prisma.schedule.create({ data: { sectionId: sec.id, dayOfWeek: combo.day, startTime: combo.s, endTime: combo.e } });
                        sectionCountBefore++;
                    }
                }
                processedKeys.add(key as string);
            }

            // PRE-PHASE 2: COOP TRANSITION — เช็คครั้งเดียวก่อนลงทะเบียนปี3เทอม2
            // ใช้ผลเรียน 5 ภาค (ป1/1, ป1/2, ป2/1, ป2/2, ป3/1) ใครไม่ผ่านก็อดเลย
            const allRecordsAtStart = await prisma.academicRecord.findMany({ include: { course: true } });
            if (coopCurric && semester === 2) {
                let coopPass = 0, coopFail = 0;
                for (const std of allStudents) {
                    if (std.curriculumId === coopCurric.id) continue; // เป็น COOP อยู่แล้ว
                    const sY = (year - std.entryYear) + 1;
                    if (sY !== 3) continue; // เช็คเฉพาะปี 3 เทอม 2
                    // เช็คเฉพาะ semester 1,2 เท่านั้น (ไม่นับ summer/sem3) — 5 ภาคการศึกษา
                    const rs = allRecordsAtStart.filter(r => r.studentId === std.userId && r.semester !== 3);
                    const tCS = rs.reduce((s,r) => s+r.cs, 0);
                    const tCA = rs.reduce((s,r) => s+r.ca, 0);
                    const gpax5 = tCA > 0 ? (rs.reduce((s,r) => s+r.gp, 0) / tCA) : 0;
                    // GPA_10: เฉลี่ยเฉพาะ 10 วิชาเกณฑ์ที่ผ่านแล้ว
                    const qp10 = rs.filter(r => COOP_CRITERIA_COURSES.includes(r.course.courseCode) && r.grade !== Grade.F);
                    const gpa10CA = qp10.reduce((s,r) => s+r.ca, 0);
                    const gpa10 = gpa10CA > 0 ? (qp10.reduce((s,r) => s+r.gp, 0) / gpa10CA) : 0;
                    if (tCS >= 90 && gpax5 >= 2.75 && qp10.length >= 10 && gpa10 >= 2.5) {
                        std.curriculumId = coopCurric.id;
                        coopPass++;
                        // ไม่ update DB ที่นี่ — จะ update ใน phase3 ตามปกติ
                    } else {
                        coopFail++;
                        // DEBUG: log 3 คนแรกที่ไม่ผ่าน
                        if (coopFail <= 3) {
                            const passed10Codes = qp10.map(r => r.course.courseCode);
                            const missing = COOP_CRITERIA_COURSES.filter(c => !passed10Codes.includes(c));
                            console.log(`\n      [COOP-FAIL] student=${std.userId.slice(0,8)} csNS=${tCS} gpax5=${gpax5.toFixed(2)} qp10=${qp10.length}/10 gpa10=${gpa10.toFixed(2)}${missing.length > 0 ? ` missing: ${missing.join(',')}` : ''}`);
                        }
                    }
                }
                if (coopPass + coopFail > 0) console.log(`\n      [COOP-CHECK] entryYear=${year-2} → pass=${coopPass} fail=${coopFail} (${((coopPass/(coopPass+coopFail))*100).toFixed(0)}%)`);
            }

            // PHASE 2: ENROLLMENT
            const sectionsPool = await prisma.section.findMany({ where: { academicYear: year, semester }, include: { schedules: true, course: true } });
            const enrollmentBatch: any[] = [];
            
            for (const std of allStudents) {
                if ((std as any)._graduated) continue; // จบแล้วไม่ต้องลงทะเบียน
                
                if (isLastOfAll) {
                    const suffix = parseInt(std.studentCode.slice(-5), 10);
                    if (suffix >= 1 && suffix <= 10) continue; // Skipped Test Cases 00001-00010 for manual testing in active term
                }

                const stdRecords = allRecordsAtStart.filter(r => r.studentId === std.userId);
                const passedIds = new Set(stdRecords.filter(r => r.grade !== Grade.F).map(r => r.courseId));
                const studyYear = (year - std.entryYear) + 1;
                const studCurriculum = allCurriculumCourses.filter(c => c.curriculumId === std.curriculumId);
                // retry เฉพาะวิชาที่ F ปีก่อน เทอมเดียวกัน — ไม่รวม COOP courses (ถ้า revert กลับ REGULAR ไม่ควร retry)
                const failedInTerm = stdRecords.filter(r => r.grade === Grade.F && r.academicYear === year - 1 && r.semester === semester && !passedIds.has(r.courseId) && !COOP_COURSE_CODES.includes(r.course.courseCode)).map(r => r.courseId);

                const isCoopStudent = std.curriculumId === coopCurric?.id;
                const queue = [
                    ...failedInTerm.map(id => ({ courseId: id, isWildcard: false, pattern: null, rYear: 0 })),
                    ...studCurriculum.filter(c => {
                        if (c.semester !== semester || c.year > studyYear) return false;
                        // COOP_COURSE: ต้องผ่าน prerequisite ทุกตัวก่อน (chain: pre-coop -> coop1 -> coop2)
                        if (c.course.category === 'COOP_COURSE') {
                            if (!isCoopStudent) return false; // ไม่ใช่ COOP student ห้ามลง
                            const prereqs = prereqMap.get(c.courseId) || [];
                            return prereqs.every(rid => passedIds.has(rid));
                        }
                        // Special Project: COOP student ห้ามลง (เส้นทาง exclusive)
                        const SPECIAL_PROJECT_CODES = ['040613141', '040613142'];
                        if (SPECIAL_PROJECT_CODES.includes(c.course.courseCode) && isCoopStudent) return false;
                        return true;
                    }).map(p => ({ courseId: p.courseId, isWildcard: p.course.isWildcard || !!p.mappingPattern, pattern: p.mappingPattern, rYear: p.year }))
                ].sort((a,b) => (a.rYear === studyYear ? -1 : 1));

                const studentSchedules: any[] = [];
                let termCredits = 0, termCourseIds = new Set(), termPatternCounts = new Map<string, number>();

                for (const item of queue) {
                    if (termCredits >= 22) break;
                    let targets: any[] = [];
                    // helper: check all prerequisites passed
                    const prereqOk = (courseId: string) => (prereqMap.get(courseId) || []).every(rid => passedIds.has(rid));

                    if (!item.isWildcard) {
                        if (passedIds.has(item.courseId!) || termCourseIds.has(item.courseId!)) continue;
                        if (!prereqOk(item.courseId!)) continue;
                        targets = sectionsPool.filter(s => s.courseId === item.courseId && s.enrolledCount < s.capacity);
                    } else {
                        let p = item.pattern?.replace('%', '') || '';
                        const isSci = p === "04";
                        const passedInPattern = stdRecords.filter(r => r.grade !== Grade.F && !allLockedCourseIds.has(r.courseId) && r.course.courseCode.startsWith(p) && !(isSci && r.course.courseCode.startsWith("0406"))).length;
                        const inTermInPattern = Array.from(termPatternCounts.keys()).filter(k => k.startsWith(p) && !(isSci && k.startsWith("0406"))).reduce((s,k) => s + termPatternCounts.get(k)!, 0);
                        const slotsRequiredUntilNow = studCurriculum.filter(c => c.year <= studyYear && c.mappingPattern === item.pattern).length;

                        if (passedInPattern + inTermInPattern >= slotsRequiredUntilNow) continue;
                        targets = sectionsPool.filter(s => s.course.courseCode.startsWith(p) && !(isSci && s.course.courseCode.startsWith("0406")) && !allLockedCourseIds.has(s.courseId) && !passedIds.has(s.courseId) && !termCourseIds.has(s.courseId) && s.enrolledCount < s.capacity && prereqOk(s.courseId));
                    }

                    for (const sec of targets) {
                        const conflict = sec.schedules.some(s1 => studentSchedules.some(s2 => s1.dayOfWeek === s2.dayOfWeek && isConflict(s1.startTime, s1.endTime, s2.startTime, s2.endTime)));
                        if (!conflict && (termCredits + sec.course.credits <= 22)) {
                            enrollmentBatch.push({ studentId: std.userId, sectionId: sec.id, academicYear: year, semester, status: EnrollmentStatus.ENROLLED });
                            sec.enrolledCount++; termCredits += sec.course.credits; termCourseIds.add(sec.courseId); studentSchedules.push(...sec.schedules);
                            if (item.isWildcard) termPatternCounts.set(item.pattern!, (termPatternCounts.get(item.pattern!) || 0) + 1);
                            break;
                        }
                    }
                }
            }

            if (enrollmentBatch.length > 0) {
                await prisma.enrollment.createMany({ data: enrollmentBatch });
                // Batch update section enrolledCount (ทีละ 50 parallel)
                const dirtySecss = sectionsPool.filter(s => s.enrolledCount > 0);
                for (let i = 0; i < dirtySecss.length; i += 50) {
                    await Promise.all(dirtySecss.slice(i, i + 50).map(s =>
                        prisma.section.update({ where: { id: s.id }, data: { enrolledCount: s.enrolledCount } })
                    ));
                }
            }

            const emptySecIds = sectionsPool.filter(s => s.enrolledCount === 0).map(s => s.id);
            if (emptySecIds.length > 0) {
                await prisma.schedule.deleteMany({ where: { sectionId: { in: emptySecIds } } });
                await prisma.section.deleteMany({ where: { id: { in: emptySecIds } } });
            }
            const sectionCountAfter = sectionCountBefore - emptySecIds.length;

            // PHASE 3: END SEMESTER
            let grads = 0, coops = 0, coopReverts = 0;
            if (!isLastOfAll) {
                await prisma.semesterConfig.update({ where: { id: activeSemester.id }, data: { isCurrent: false } });
                const termPool = await prisma.enrollment.findMany({ where: { academicYear: year, semester }, include: { section: { include: { course: true } } } });
                const recBatch: any[] = [];
                // Batch: สร้าง grade ทุก enrollment แล้ว update ทีเดียว (แทน await ทีละตัว)
                const enrollUpdates: { id: string; midtermScore: number; finalScore: number; totalScore: number; grade: Grade; status: EnrollmentStatus }[] = [];
                for (const e of termPool) {
                    const total = getRandomTotal();
                    const { midterm, final: finalScore } = splitScore(total);
                    const grade = calculateGrade(total);
                    const gp = GP_MAP[grade] ?? 0;
                    const cr = e.section.course.credits;
                    enrollUpdates.push({ id: e.id, midtermScore: midterm, finalScore, totalScore: total, grade, status: EnrollmentStatus.SUCCESS });
                    recBatch.push({ studentId: e.studentId, courseId: e.section.courseId, academicYear: year, semester, grade, gpa: gp, gp: gp * cr, ca: cr, cs: grade === Grade.F ? 0 : cr });
                }
                // Batch update enrollments (ทีละ 50 parallel)
                for (let i = 0; i < enrollUpdates.length; i += 50) {
                    await Promise.all(enrollUpdates.slice(i, i + 50).map(u =>
                        prisma.enrollment.update({ where: { id: u.id }, data: { midtermScore: u.midtermScore, finalScore: u.finalScore, totalScore: u.totalScore, grade: u.grade, status: u.status } })
                    ));
                }
                await prisma.academicRecord.createMany({ data: recBatch });

                // สร้าง lookup map แทน findMany ทั้ง table (เร็วกว่า filter ทุกรอบ)
                const freshRecords = await prisma.academicRecord.findMany({ include: { course: true } });
                const recordsByStudent = new Map<string, typeof freshRecords>();
                for (const r of freshRecords) {
                    const arr = recordsByStudent.get(r.studentId) || [];
                    arr.push(r);
                    recordsByStudent.set(r.studentId, arr);
                }
                // หา courseIds ของ pre-coop + coop1 เพื่อเช็ค F → revert (coop2 F ไม่ revert เพราะเป็นวิชาท้าย chain)
                const coopRevertIds = new Set(allCourses.filter(c => COOP_REVERT_CODES.includes(c.courseCode)).map(c => c.id));

                // Batch: คำนวณ profile ทุกคน แล้ว update ทีเดียว
                const profileUpdates: { userId: string; data: any }[] = [];
                for (const std of allStudents) {
                    const rs = recordsByStudent.get(std.userId) || [];
                    const tCA = rs.reduce((s,r) => s+r.ca, 0), tCS = rs.reduce((s,r) => s+r.cs,0), gpax = tCA > 0 ? (rs.reduce((s,r) => s+r.gp, 0) / tCA) : 0;
                    const sY = (year - std.entryYear) + 1;
                    let cId = std.curriculumId;

                    // 🎓 COOP TRANSITION COUNT
                    if (coopCurric && cId === coopCurric.id && !(std as any)._coopCounted) {
                        (std as any)._coopCounted = true;
                        coops++;
                    }
                    // ⛔ COOP F CHECK: pre-coop/coop1 F → กลับหลักสูตรปกติ (coop2 F ไม่ revert เพราะวิชาท้าย)
                    if (coopCurric && regularCurric && cId === coopCurric.id) {
                        const gotFInCoopRevert = rs.some(r =>
                            r.academicYear === year && r.semester === semester &&
                            r.grade === Grade.F && coopRevertIds.has(r.courseId)
                        );
                        if (gotFInCoopRevert) {
                            cId = regularCurric.id;
                            coopReverts++;
                        }
                    }
                    // 🎓 GRADUATION CHECK: หน่วยกิตครบ + ผ่านวิชาบังคับทุกตัว + GPAX >= 2.0
                    const allCorePassedForCurric = requiredCoreFull
                        .filter(c => c.curriculumId === cId)
                        .every(c => rs.some(r => r.courseId === c.courseId && r.grade !== Grade.F));
                    
                    const minCurric = cId ? (await prisma.curriculum.findUnique({ where: { id: cId } })) : null;
                    const minCredits = minCurric?.totalCredits || 128;
                    const isG = tCS >= minCredits && gpax >= 2.0 && allCorePassedForCurric;
                    if (isG) grads++;
                    // sync in-memory
                    std.curriculumId = cId;
                    std.year = sY;
                    if (isG) (std as any)._graduated = true;
                    profileUpdates.push({ userId: std.userId, data: { gpax: parseFloat(gpax.toFixed(2)), ca: tCA, cs: tCS, year: sY, status: isG ? StudentStatus.GRADUATED : StudentStatus.STUDYING, curriculumId: cId } });
                }
                // Batch update profiles (ทีละ 50 parallel)
                for (let i = 0; i < profileUpdates.length; i += 50) {
                    await Promise.all(profileUpdates.slice(i, i + 50).map(u =>
                        prisma.studentProfile.update({ where: { userId: u.userId }, data: u.data })
                    ));
                }
            }
            const revertStr = coopReverts > 0 ? ` | ⛔ F→REG: ${coopReverts}` : '';
            process.stdout.write(`📝 Enroll: ${enrollmentBatch.length.toString().padEnd(4)} | 🏫 Secs: ${sectionCountBefore} → ${sectionCountAfter} | 🎓 Grad: ${grads.toString().padEnd(2)} | 🤝 COOP: ${coops.toString().padEnd(2)}${revertStr} | ⏱️ `);
            console.timeEnd(termTag);
        }
    }
    console.log('\n✅ [SUCCESS] Master seed complete.');
    console.timeEnd("⏱️  Total Execution Time");
}

main().catch(console.error);