import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const s69 = await prisma.studentProfile.count({ where: { entryYear: 2569 } });
    const enr = await prisma.enrollment.count({ where: { academicYear: 2569, semester: 1 } });
    const grad = await prisma.studentProfile.count({ where: { status: 'GRADUATED' } });
    console.log(`69 Students: ${s69}`);
    console.log(`1/2569 Enrollments: ${enr}`);
    console.log(`Graduated Students: ${grad}`);
}
main().finally(() => prisma.$disconnect());
