import "dotenv/config";
import { PrismaClient, Grade, DayOfWeek, StudentStatus, EnrollmentStatus } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
// Supabase free tier จำกัด connections — cap pool ที่ 5 เพื่อป้องกัน "Max client connections reached"
const pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
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
        // Fix: actual slot sum for REGULAR = 125 (not 128). Patch DB to match curriculum.json.
        await prisma.curriculum.update({ where: { id: regularCurric.id }, data: { totalCredits: 125 } });
    }
    console.log('Done.');

    const allStudents = await prisma.studentProfile.findMany();
    let professors = await prisma.professorProfile.findMany();
    
    // Add 80 more professors if we have too few to prevent heavy overlaps
    if (professors.length < 100) {
        process.stdout.write('   👨‍🏫 Adding 80 more professors... ');
        const hash = await bcrypt.hash('password123', 10);
        const newProfs: any[] = [];
        const firstNames = [
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
        const lastNames = [
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
        const csFaculty = await prisma.faculty.findUnique({ where: { facultyCode: '04' } });
        const csDept = await prisma.department.findUnique({ where: { facultyId_deptCode: { facultyId: csFaculty!.id, deptCode: '06' } } });

        for (let i = 0; i < 80; i++) {
            const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
            const email = `prof.bulk${i + 1}@unily.ac.th`;
            const user = await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email, password: hash,
                    firstName: fname, lastName: lname,
                    role: 'PROFESSOR', status: 'ACTIVE'
                }
            });
            const profile = await prisma.professorProfile.upsert({
                where: { userId: user.id },
                update: {},
                create: { userId: user.id, facultyId: csFaculty!.id, deptId: csDept!.id }
            });
            newProfs.push(profile);
        }
        professors.push(...newProfs);
        console.log('Done.');
    }

    let globalProfIndex = 0;

    const coopCurric = await prisma.curriculum.findUnique({ where: { curriculumCode: "CS64-COOP" } });
    const allCourses = await prisma.course.findMany();
    // ─── Special course IDs ───────────────────────────────────────────────────
    const COOP2_COURSE_CODE  = '040613132'; // COOP2 — exclusive term (no other courses allowed)
    const PRECOOP_COURSE_CODE = '040613130'; // pre-COOP — S/U graded, no GPA contribution
    const coop2CourseId  = allCourses.find(c => c.courseCode === COOP2_COURSE_CODE)?.id  ?? '';
    const preCoopCourseId = allCourses.find(c => c.courseCode === PRECOOP_COURSE_CODE)?.id ?? '';
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

    // Pre-fetch curriculum totalCredits to avoid N+1 DB queries inside the student loop
    const allCurriculaFull = await prisma.curriculum.findMany();
    const curriculumCreditsMap = new Map(allCurriculaFull.map(c => [c.id, c.totalCredits]));

    const TARGET_YEAR = 2569;
    const TARGET_SEM = 1;

    // semester config dates (ISO string -> Date)
    const SEMESTER_DATES: Record<string, { regStart: Date; regEnd: Date; withdrawStart: Date; withdrawEnd: Date; isCurrent: boolean }> = {
        "2565-1": { regStart: new Date("2022-07-04T01:00:00+07:00"), regEnd: new Date("2022-07-18T09:00:00+07:00"), withdrawStart: new Date("2022-07-04T01:00:00+07:00"), withdrawEnd: new Date("2022-08-29T11:00:00+07:00"), isCurrent: false },
        "2565-2": { regStart: new Date("2022-11-07T01:00:00+07:00"), regEnd: new Date("2022-11-21T09:00:00+07:00"), withdrawStart: new Date("2022-11-07T01:00:00+07:00"), withdrawEnd: new Date("2023-01-02T11:00:00+07:00"), isCurrent: false },
        "2565-3": { regStart: new Date("2023-04-03T01:00:00+07:00"), regEnd: new Date("2023-04-10T09:00:00+07:00"), withdrawStart: new Date("2023-04-03T01:00:00+07:00"), withdrawEnd: new Date("2023-05-15T11:00:00+07:00"), isCurrent: false },
        "2566-1": { regStart: new Date("2023-07-03T01:00:00+07:00"), regEnd: new Date("2023-07-17T09:00:00+07:00"), withdrawStart: new Date("2023-07-03T01:00:00+07:00"), withdrawEnd: new Date("2023-08-28T11:00:00+07:00"), isCurrent: false },
        "2566-2": { regStart: new Date("2023-11-06T01:00:00+07:00"), regEnd: new Date("2023-11-20T09:00:00+07:00"), withdrawStart: new Date("2023-11-06T01:00:00+07:00"), withdrawEnd: new Date("2024-01-01T11:00:00+07:00"), isCurrent: false },
        "2566-3": { regStart: new Date("2024-04-01T01:00:00+07:00"), regEnd: new Date("2024-04-08T09:00:00+07:00"), withdrawStart: new Date("2024-04-01T01:00:00+07:00"), withdrawEnd: new Date("2024-05-13T11:00:00+07:00"), isCurrent: false },
        "2567-1": { regStart: new Date("2024-07-01T01:00:00+07:00"), regEnd: new Date("2024-07-15T09:00:00+07:00"), withdrawStart: new Date("2024-07-01T01:00:00+07:00"), withdrawEnd: new Date("2024-08-26T11:00:00+07:00"), isCurrent: false },
        "2567-2": { regStart: new Date("2024-11-04T01:00:00+07:00"), regEnd: new Date("2024-11-18T09:00:00+07:00"), withdrawStart: new Date("2024-11-04T01:00:00+07:00"), withdrawEnd: new Date("2024-12-30T11:00:00+07:00"), isCurrent: false },
        "2567-3": { regStart: new Date("2025-04-07T01:00:00+07:00"), regEnd: new Date("2025-04-14T09:00:00+07:00"), withdrawStart: new Date("2025-04-07T01:00:00+07:00"), withdrawEnd: new Date("2025-05-19T11:00:00+07:00"), isCurrent: false },
        "2568-1": { regStart: new Date("2025-07-07T01:00:00+07:00"), regEnd: new Date("2025-07-21T09:00:00+07:00"), withdrawStart: new Date("2025-07-07T01:00:00+07:00"), withdrawEnd: new Date("2025-09-01T11:00:00+07:00"), isCurrent: false },
        "2568-2": { regStart: new Date("2025-11-03T01:00:00+07:00"), regEnd: new Date("2025-11-17T09:00:00+07:00"), withdrawStart: new Date("2025-11-03T01:00:00+07:00"), withdrawEnd: new Date("2025-12-29T11:00:00+07:00"), isCurrent: false },
        "2568-3": { regStart: new Date("2026-04-06T01:00:00+07:00"), regEnd: new Date("2026-04-13T09:00:00+07:00"), withdrawStart: new Date("2026-04-06T01:00:00+07:00"), withdrawEnd: new Date("2026-05-18T11:00:00+07:00"), isCurrent: false },
        "2569-1": { regStart: new Date("2026-03-23T01:00:00+07:00"), regEnd: new Date("2026-04-07T09:00:00+07:00"), withdrawStart: new Date("2026-03-23T01:00:00+07:00"), withdrawEnd: new Date("2026-05-19T11:00:00+07:00"), isCurrent: true },
    };

    // ── Centralized SemesterConfig ─────────────────────────────────────────────
    // Delete all existing configs, then create ALL semesters upfront.
    // isCurrent = true only for the final target semester (TARGET_YEAR/TARGET_SEM).
    await prisma.semesterConfig.deleteMany({});
    const allTermKeys: string[] = [];
    for (const y of [2565, 2566, 2567, 2568, 2569]) {
        for (const s of [1, 2, 3]) {
            if (y === TARGET_YEAR && s > TARGET_SEM) continue;
            allTermKeys.push(`${y}-${s}`);
        }
    }
    const createdSemesters = new Map<string, { id: string; academicYear: number; semester: number }>();
    for (const key of allTermKeys) {
        const semDates = SEMESTER_DATES[key];
        if (!semDates) continue;
        const [y, s] = key.split('-').map(Number);
        const isCurrentTerm = (y === TARGET_YEAR && s === TARGET_SEM);
        const sc = await prisma.semesterConfig.create({
            data: { academicYear: y, semester: s, ...semDates, isCurrent: isCurrentTerm }
        });
        createdSemesters.set(key, sc);
    }
    console.log(`   ✅ Created ${createdSemesters.size} semester configs (current: ${TARGET_YEAR}/${TARGET_SEM})\n`);

    for (const year of [2565, 2566, 2567, 2568, 2569]) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━ Year: ${year} ━━━━━━━━━━━━━━━━━━━━━━━━`);
        for (const semester of [1, 2, 3]) {
            if (year === TARGET_YEAR && semester > TARGET_SEM) continue;
            const isLastOfAll = (year === TARGET_YEAR && semester === TARGET_SEM);

            process.stdout.write(`   🔹 Term ${semester}: `);
            const termTag = `[${year}/${semester}]`;
            console.time(termTag);

            const activeSemester = createdSemesters.get(`${year}-${semester}`)!;
            // PHASE 1: SECTIONS
            // เทอม 3 = COOP semester — เปิดเฉพาะ COOP1 (040613131) เท่านั้น
            // เทอม 1/2 = ปกติ + วิชาเสรีเปิดทุกเทอม
            const plannedCourses = allCurriculumCourses.filter(c => {
                if (activeSemester.semester === 3) {
                    // COOP semester: only COOP_COURSE in semester 3 slot (= COOP1)
                    return c.semester === 3 && c.course.category === 'COOP_COURSE';
                }
                return (
                    c.semester === activeSemester.semester ||
                    c.course.category === 'FREE_ELECTIVE' // วิชาเสรีเปิดทุก sem 1/2
                );
            });
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
                // ปี 5+ = เรียนเกินหลักสูตร 4 ปี → ผ่อนปรนข้อจำกัด semester + ดึง F ทุกตัว
                const isOverdueStudent = studyYear > 4;

                // failedItems: ปี 5+ ดึงทุก F ที่ยังไม่ผ่าน (de-dup by courseId/pattern)
                // ปีปกติ: core F → ต้องตรง semester เดิม; wildcard F → retry ได้ทุก semester (เพราะเปิดทุกเทอม)
                type FailItem = { courseId: string | null; isWildcard: boolean; pattern: string | null; rYear: number };
                const failedItems: FailItem[] = [];
                const seenFailCourseIds = new Set<string>();
                const seenFailPatterns = new Set<string>();
                for (const r of stdRecords) {
                    if (r.grade !== Grade.F) continue;
                    if (passedIds.has(r.courseId)) continue;
                    if (COOP_COURSE_CODES.includes(r.course.courseCode)) continue;
                    // ถ้าวิชาที่ F อยู่ใน core slot (ไม่ใช่ wildcard) → ต้องลงวิชาเดิม + ต้องตรง semester
                    const isCore = studCurriculum.some(cc => cc.courseId === r.courseId && !cc.mappingPattern && !cc.course.isWildcard);
                    if (isCore) {
                        // Core: ปีปกติ → ต้องตรง semester; ปี 5+ → ยืดหยุ่น
                        if (!isOverdueStudent && r.semester !== semester) continue;
                        if (!seenFailCourseIds.has(r.courseId)) {
                            seenFailCourseIds.add(r.courseId);
                            failedItems.push({ courseId: r.courseId, isWildcard: false, pattern: null, rYear: 0 });
                        }
                    } else {
                        // Wildcard elective: retry ได้ทุก semester (sections เปิดทุกเทอม)
                        const wc = studCurriculum.find(cc => cc.mappingPattern && r.course.courseCode.startsWith(cc.mappingPattern.replace('%', '')));
                        if (wc && !seenFailPatterns.has(wc.mappingPattern!)) {
                            seenFailPatterns.add(wc.mappingPattern!);
                            failedItems.push({ courseId: null, isWildcard: true, pattern: wc.mappingPattern, rYear: 0 });
                        } else if (!wc && !seenFailCourseIds.has(r.courseId)) {
                            seenFailCourseIds.add(r.courseId);
                            failedItems.push({ courseId: r.courseId, isWildcard: false, pattern: null, rYear: 0 });
                        }
                    }
                }

                const isCoopStudent = std.curriculumId === coopCurric?.id;
                const queue = [
                    ...failedItems,
                    ...studCurriculum.filter(c => {
                        if (c.year > studyYear) return false;
                        // ปี 5+: ไม่จำกัด semester — เรียนวิชาที่เหลือทุกเทอมได้
                        if (!isOverdueStudent && c.semester !== semester) return false;
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
                ].sort((a, b) => {
                    // 1. Current-year courses before older-year retries
                    const aCurr = a.rYear === studyYear, bCurr = b.rYear === studyYear;
                    if (aCurr !== bCurr) return aCurr ? -1 : 1;
                    // 2. Within same "tier", specific courses before wildcards (prevents
                    //    wildcards filling the credit budget before required specifics like
                    //    Special Project 1 which is only 1 credit)
                    if (!a.isWildcard && b.isWildcard) return -1;
                    if (a.isWildcard && !b.isWildcard) return 1;
                    return 0;
                });

                const studentSchedules: any[] = [];
                let termCredits = 0, termCourseIds = new Set(), termPatternCounts = new Map<string, number>();

                // COOP2 exclusive: ถ้า COOP2 อยู่ใน queue ให้ลงแค่ COOP2 เท่านั้น (ไปทำงานจริง ไม่มีเรียนวิชาอื่น)
                const hasCoop2 = coop2CourseId && queue.some(item => !item.isWildcard && item.courseId === coop2CourseId);
                const effectiveQueue = hasCoop2
                    ? queue.filter(item => !item.isWildcard && item.courseId === coop2CourseId)
                    : queue;

                for (const item of effectiveQueue) {
                    if (termCredits >= 22) break;
                    let targets: any[] = [];
                    // helper: check all prerequisites passed
                    const prereqOk = (courseId: string) => (prereqMap.get(courseId) || []).every(rid => passedIds.has(rid));

                    if (!item.isWildcard) {
                        if (passedIds.has(item.courseId!) || termCourseIds.has(item.courseId!)) continue;
                        if (!prereqOk(item.courseId!)) continue;
                        targets = sectionsPool.filter(s => s.courseId === item.courseId && s.enrolledCount < s.capacity);
                    } else {
                        const pat          = item.pattern!;
                        const p            = pat.replace('%', '');
                        const isSci        = pat === '04%';
                        const isSocialElec = pat === '0802%'; // 0802% + GENERAL_EDUCATION
                        const isFreeElec   = pat === '%';     // category FREE_ELECTIVE (ไม่ซ้ำ SOCIAL-ELEC)

                        // ── passedInPattern ───────────────────────────────────────────────
                        const passedInPattern = stdRecords.filter(r => {
                            if (r.grade === Grade.F) return false;
                            if (allLockedCourseIds.has(r.courseId)) return false;
                            if (isSocialElec) return r.course.courseCode.startsWith('0802') && r.course.category === 'GENERAL_EDUCATION';
                            if (isFreeElec)   return r.course.category === 'FREE_ELECTIVE';
                            if (isSci)        return r.course.courseCode.startsWith('04') && !r.course.courseCode.startsWith('0406');
                            return r.course.courseCode.startsWith(p);
                        }).length;

                        const inTermInPattern       = termPatternCounts.get(pat) ?? 0;
                        const slotsRequiredUntilNow = studCurriculum.filter(c => c.year <= studyYear && c.mappingPattern === pat).length;

                        if (passedInPattern + inTermInPattern >= slotsRequiredUntilNow) continue;

                        // ── targets ───────────────────────────────────────────────────────
                        const baseFilter = (s: any) =>
                            !allLockedCourseIds.has(s.courseId) &&
                            !passedIds.has(s.courseId) &&
                            !termCourseIds.has(s.courseId) &&
                            s.enrolledCount < s.capacity &&
                            prereqOk(s.courseId);

                        if (isSocialElec) {
                            targets = sectionsPool.filter(s =>
                                s.course.courseCode.startsWith('0802') &&
                                s.course.category === 'GENERAL_EDUCATION' &&
                                baseFilter(s)
                            );
                        } else if (isFreeElec) {
                            targets = sectionsPool.filter(s =>
                                s.course.category === 'FREE_ELECTIVE' &&
                                baseFilter(s)
                            );
                        } else if (isSci) {
                            targets = sectionsPool.filter(s =>
                                s.course.courseCode.startsWith('04') &&
                                !s.course.courseCode.startsWith('0406') &&
                                baseFilter(s)
                            );
                        } else {
                            // CS-ELEC (0406%), LANG-ELEC (0801%), SPORT-ELEC (0803035%), HUMAN-ELEC (0803036%) etc.
                            targets = sectionsPool.filter(s =>
                                s.course.courseCode.startsWith(p) &&
                                baseFilter(s)
                            );
                        }
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
                // Bulk update section enrolledCount via raw SQL
                const dirtySecss = sectionsPool.filter(s => s.enrolledCount > 0);
                if (dirtySecss.length > 0) {
                    const vals = dirtySecss.map(s => `('${s.id}'::uuid,${s.enrolledCount})`).join(',');
                    await prisma.$executeRawUnsafe(`
                        UPDATE "Section" sec SET "enrolledCount"=v.cnt
                        FROM (VALUES ${vals}) AS v(id,cnt)
                        WHERE sec.id=v.id
                    `);
                }
            }

            const emptySecIds = sectionsPool.filter(s => s.enrolledCount === 0).map(s => s.id);
            if (emptySecIds.length > 0) {
                await prisma.schedule.deleteMany({ where: { sectionId: { in: emptySecIds } } });
                await prisma.section.deleteMany({ where: { id: { in: emptySecIds } } });
            }
            const sectionCountAfter = sectionCountBefore - emptySecIds.length;

            // สำหรับ isLastOfAll: Phase 3 ไม่รัน (เทอมปัจจุบัน ยังไม่มีเกรด)
            // แต่ต้อง update year ให้ถูกต้อง (ไม่งั้นปี 5 จะยังแสดงเป็นปี 4)
            if (isLastOfAll) {
                const yearBatch = allStudents
                    .filter(std => !(std as any)._graduated)
                    .map(std => ({ userId: std.userId, year: Math.max(1, (year - std.entryYear) + 1) }));
                if (yearBatch.length > 0) {
                    const vals = yearBatch.map(u => `('${u.userId}'::uuid,${u.year})`).join(',');
                    await prisma.$executeRawUnsafe(`
                        UPDATE "StudentProfile" sp SET year=v.yr
                        FROM (VALUES ${vals}) AS v(uid,yr)
                        WHERE sp."userId"=v.uid
                    `);
                }
                process.stdout.write(`   📅 Updated year for ${yearBatch.length} active students\n`);
            }

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
                    // pre-COOP (040613130) = S/U graded: ไม่คิด GPA (ca=0, gp=0) แต่ยังนับ credit สำเร็จ
                    const isPreCoop = e.section.courseId === preCoopCourseId;
                    recBatch.push({
                        studentId: e.studentId, courseId: e.section.courseId, academicYear: year, semester, grade,
                        gpa: gp,
                        gp: isPreCoop ? 0 : gp * cr,   // pre-COOP: ไม่ contribute grade points
                        ca: isPreCoop ? 0 : cr,          // pre-COOP: ไม่ contribute credits attempted (ไม่คิด GPA)
                        cs: grade === Grade.F ? 0 : cr   // ทุกวิชา (รวม pre-COOP): นับ credit passed ปกติ
                    });
                }
                // Bulk update enrollments via single raw SQL (ไม่ต้อง N round trips)
                if (enrollUpdates.length > 0) {
                    const CHUNK = 300;
                    for (let i = 0; i < enrollUpdates.length; i += CHUNK) {
                        const chunk = enrollUpdates.slice(i, i + CHUNK);
                        const vals = chunk.map(u =>
                            `('${u.id}'::uuid,${u.midtermScore},${u.finalScore},${u.totalScore},'${u.grade}'::"Grade",'SUCCESS'::"EnrollmentStatus")`
                        ).join(',');
                        await prisma.$executeRawUnsafe(`
                            UPDATE "Enrollment" e
                            SET "midtermScore"=v.mid,"finalScore"=v.fin,"totalScore"=v.tot,
                                grade=v.g::"Grade",status=v.s::"EnrollmentStatus"
                            FROM (VALUES ${vals}) AS v(id,mid,fin,tot,g,s)
                            WHERE e.id=v.id
                        `);
                    }
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
                    
                    const minCredits = curriculumCreditsMap.get(cId ?? '') ?? 128;
                    const isG = tCS >= minCredits && gpax >= 2.0 && allCorePassedForCurric;
                    if (isG) grads++;
                    // sync in-memory
                    std.curriculumId = cId;
                    std.year = sY;
                    if (isG) (std as any)._graduated = true;
                    profileUpdates.push({ userId: std.userId, data: { gpax: parseFloat(gpax.toFixed(2)), ca: tCA, cs: tCS, year: sY, status: isG ? StudentStatus.GRADUATED : StudentStatus.STUDYING, curriculumId: cId } });
                }
                // Bulk update student profiles via raw SQL (single round trip per chunk)
                if (profileUpdates.length > 0) {
                    const CHUNK = 200;
                    for (let i = 0; i < profileUpdates.length; i += CHUNK) {
                        const chunk = profileUpdates.slice(i, i + CHUNK);
                        const vals = chunk.map(u =>
                            `('${u.userId}'::uuid,${u.data.gpax},${u.data.ca},${u.data.cs},${u.data.year},'${u.data.status}'::"StudentStatus",'${u.data.curriculumId}'::uuid)`
                        ).join(',');
                        await prisma.$executeRawUnsafe(`
                            UPDATE "StudentProfile" sp
                            SET gpax=v.gpax,ca=v.ca,cs=v.cs,year=v.year,
                                status=v.status::"StudentStatus","curriculumId"=v.cid
                            FROM (VALUES ${vals}) AS v(uid,gpax,ca,cs,year,status,cid)
                            WHERE sp."userId"=v.uid
                        `);
                    }
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