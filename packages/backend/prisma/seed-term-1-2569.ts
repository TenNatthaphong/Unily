import "dotenv/config";
import { PrismaClient, Grade, DayOfWeek, StudentStatus, EnrollmentStatus } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const DAYS: DayOfWeek[] = [DayOfWeek.MON, DayOfWeek.TUE, DayOfWeek.WED, DayOfWeek.THU, DayOfWeek.FRI];
const TIME_SLOTS = {
    h2: [{ s: "09:00", e: "11:00" }, { s: "13:00", e: "15:00" }, { s: "15:00", e: "17:00" }],
    h3: [{ s: "09:00", e: "12:00" }, { s: "13:00", e: "16:00" }, { s: "17:00", e: "20:00" }],
    h4: [{ s: "08:30", e: "12:30" }, { s: "13:00", e: "17:00" }, { s: "17:00", e: "21:00" }]
};

const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const isConflict = (s1S: string, s1E: string, s2S: string, s2E: string) => timeToMin(s1S) < timeToMin(s2E) && timeToMin(s1E) > timeToMin(s2S);

async function main() {
    console.log('🚀 [STARTING SEED: Enrollment Simulation 1/2569]');

    // 1. Find Current Semester
    const currentConfig = await prisma.semesterConfig.findFirst({ where: { isCurrent: true } });
    if (!currentConfig) { console.error('❌ No current semester found.'); return; }
    const { academicYear: activeYear, semester: activeSem } = currentConfig;
    console.log(`📅 Target Semester: ${activeSem}/${activeYear} (Registration is OPEN)`);

    // 2. Global Cleanup for the target semester (Clear all students' enrollments)
    console.log(`🧹 Cleaning ALL enrollments for ${activeSem}/${activeYear}...`);
    await prisma.schedule.deleteMany({ where: { section: { academicYear: activeYear, semester: activeSem } } });
    await prisma.enrollment.deleteMany({ where: { academicYear: activeYear, semester: activeSem } });
    await prisma.section.deleteMany({ where: { academicYear: activeYear, semester: activeSem } });

    // 3. Re-Sync Batch 69 Students (Keep clean 200)
    console.log('🎓 Syncing 200 Students for Batch 69...');
    const old69Users = await prisma.user.findMany({ where: { studentProfile: { entryYear: 2569 } } });
    await prisma.studentProfile.deleteMany({ where: { entryYear: 2569 } });
    await prisma.user.deleteMany({ where: { id: { in: old69Users.map(u => u.id) } } });

    const csFaculty = await prisma.faculty.findUnique({ where: { facultyCode: '04' } });
    const csDept = await prisma.department.findUnique({ where: { facultyId_deptCode: { facultyId: csFaculty!.id, deptCode: '06' } } });
    const regCurric = await prisma.curriculum.findUnique({ where: { curriculumCode: 'CS64-REGULAR' } });

    const sharedPassword = await bcrypt.hash("unily69", 10);
    for (let i = 1; i <= 200; i++) {
        const studentCode = `690406${i.toString().padStart(5, '0')}`;
        const u = await prisma.user.create({
            data: {
                email: `u${studentCode}@unily.ac.th`, password: sharedPassword,
                firstName: `Student69`, lastName: `No${i.toString().padStart(5, '0')}`,
                role: 'STUDENT', status: 'ACTIVE'
            }
        });
        await prisma.studentProfile.create({
            data: {
                userId: u.id, studentCode, entryYear: 2569, year: 1, 
                facultyId: csFaculty!.id, deptId: csDept!.id, curriculumId: regCurric!.id, status: StudentStatus.STUDYING
            }
        });
    }

    // 4. Create Sections & Schedules (Optimized Distribution)
    console.log('🏫 Generating Sections Catalog...');
    const plannedCourses = await prisma.curriculumCourse.findMany({ where: { semester: activeSem }, include: { course: true } });
    const profs = await prisma.professorProfile.findMany();
    const allCourses = await prisma.course.findMany();
    const processedKeys = new Set<string>();

    for (const pc of plannedCourses) {
        const isWildcard = !!pc.mappingPattern;
        const key = isWildcard ? pc.mappingPattern : pc.courseId;
        if (processedKeys.has(key as string)) continue;

        const targets = isWildcard 
            ? allCourses.filter(c => c.courseCode.startsWith(pc.mappingPattern!.replace('%', ''))).slice(0, 4)
            : [pc.course];

        for (const [idx, tc] of targets.entries()) {
            const hrs = (tc.lectureHours || 0) + (tc.labHours || 0);
            const slotGrp = hrs >= 4 ? TIME_SLOTS.h4 : (hrs === 2 ? TIME_SLOTS.h2 : TIME_SLOTS.h3);
            const nSec = isWildcard ? 2 : 12; // More sections for core to handle all years

            for (let s = 1; s <= nSec; s++) {
                // Strategic distribution
                const day = DAYS[(s + idx) % DAYS.length];
                const slot = slotGrp[(s + idx) % slotGrp.length];
                const sec = await prisma.section.create({
                    data: {
                        courseId: tc.id, professorId: profs[Math.floor(Math.random() * profs.length)].userId,
                        academicYear: activeYear, semester: activeSem, sectionNo: s, capacity: 45
                    }
                });
                await prisma.schedule.create({ data: { sectionId: sec.id, dayOfWeek: day, startTime: slot.s, endTime: slot.e } });
            }
        }
        processedKeys.add(key as string);
    }

    // 5. Mass Auto-Enrollment (Simulating "Real" Enrollment State)
    console.log('📝 Processing Bulk Enrollment for ALL Active Students...');
    const sections = await prisma.section.findMany({
        where: { academicYear: activeYear, semester: activeSem },
        include: { course: true, schedules: true }
    });
    const students = await prisma.studentProfile.findMany({ where: { status: StudentStatus.STUDYING } });
    
    // Fetch all academic records for these students to avoid re-enrolling in passed courses
    const allRecords = await prisma.academicRecord.findMany({
        where: { studentId: { in: students.map(s => s.userId) }, grade: { not: Grade.F } },
        select: { studentId: true, courseId: true, course: { select: { courseCode: true } } }
    });
    const recordsMap = new Map<string, { ids: Set<string>, codes: string[] }>();
    for (const r of allRecords) {
        if (!recordsMap.has(r.studentId)) recordsMap.set(r.studentId, { ids: new Set(), codes: [] });
        const entry = recordsMap.get(r.studentId)!;
        entry.ids.add(r.courseId);
        entry.codes.push(r.course.courseCode);
    }
    
    const enrollmentBuffer: any[] = [];
    for (const std of students) {
        if (std.studentCode.endsWith('00001')) continue; // Skipped Test Case

        const studyYear = (activeYear - std.entryYear) + 1;
        if (!std.curriculumId) continue;

        const curricCourses = await prisma.curriculumCourse.findMany({
            where: { curriculumId: std.curriculumId, year: { lte: studyYear }, semester: activeSem },
            include: { course: true }
        });

        const myPassed = recordsMap.get(std.userId) || { ids: new Set<string>(), codes: [] as string[] };
        const myScheds: any[] = [];
        const myEnrolledCourseIds = new Set<string>();
        let myCredits = 0;
        const myPatternCounts = new Map<string, number>();

        for (const cc of curricCourses) {
            if (myCredits >= 21) break;
            const isWildcard = !!cc.mappingPattern;

            // 1. If core course and already passed, skip
            if (!isWildcard && myPassed.ids.has(cc.courseId)) continue;
            // 2. Already enrolled in this specific course in this loop
            if (!isWildcard && myEnrolledCourseIds.has(cc.courseId)) continue;

            // 3. For wildcard/elective, check if we already fulfilled this requirement slot
            if (isWildcard) {
                const pattern = cc.mappingPattern!.replace('%', '');
                const passedCount = myPassed.codes.filter(c => c.startsWith(pattern)).length;
                const inLoopCount = Array.from(myEnrolledCourseIds).filter(cid => {
                    const sec = sections.find(s => s.courseId === cid);
                    return sec?.course.courseCode.startsWith(pattern);
                }).length;

                // Count how many slots for this pattern we have in the curriculum up to this year/semester
                const totalSlots = curricCourses.filter(c => c.mappingPattern === cc.mappingPattern).length;
                
                if (passedCount + inLoopCount >= totalSlots) continue;
            }

            const possibleSecs = sections.filter(s => {
                const match = isWildcard ? s.course.courseCode.startsWith(cc.mappingPattern!.replace('%', '')) : s.courseId === cc.courseId;
                return match && s.enrolledCount < s.capacity && !myPassed.ids.has(s.courseId) && !myEnrolledCourseIds.has(s.courseId);
            }).sort((a,b) => a.enrolledCount - b.enrolledCount);

            for (const sec of possibleSecs) {
                const conflict = sec.schedules.some(s1 => 
                    myScheds.some(s2 => s1.dayOfWeek === s2.dayOfWeek && isConflict(s1.startTime, s1.endTime, s2.startTime, s2.endTime))
                );
                if (!conflict && myCredits + sec.course.credits <= 22) {
                    enrollmentBuffer.push({ studentId: std.userId, sectionId: sec.id, academicYear: activeYear, semester: activeSem, status: EnrollmentStatus.ENROLLED });
                    myScheds.push(...sec.schedules);
                    myCredits += sec.course.credits;
                    myEnrolledCourseIds.add(sec.courseId);
                    sec.enrolledCount++;
                    break;
                }
            }
        }
    }

    if (enrollmentBuffer.length > 0) {
        await prisma.enrollment.createMany({ data: enrollmentBuffer });
        for (const s of sections.filter(s => s.enrolledCount > 0)) {
            await prisma.section.update({ where: { id: s.id }, data: { enrolledCount: s.enrolledCount } });
        }
    }

    console.log(`🏁 Enrollment Complete. Total Records: ${enrollmentBuffer.length}. Status: NO GRADES CALCULATED (Semester Active).`);
}

main().then(async () => { await prisma.$disconnect(); await pool.end(); }).catch(e => { console.error(e); process.exit(1); });
