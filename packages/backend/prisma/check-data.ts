import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const faculties = await prisma.faculty.count();
    const depts = await prisma.department.count();
    const curriculums = await prisma.curriculum.count();
    const courses = await prisma.course.count();
    console.log(`Faculties: ${faculties}`);
    console.log(`Departments: ${depts}`);
    console.log(`Curriculums: ${curriculums}`);
    console.log(`Courses: ${courses}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
