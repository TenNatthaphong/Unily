import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function check() {
  const depts = await prisma.department.findMany({ where: { deptCode: '0406' } });
  console.log('Depts 0406 found count:', depts.length);
  depts.forEach(d => console.log(`ID: ${d.id}, FacID: ${d.facultyId}, FacCode: ${d.facultyCode}`));
  
  const currs = await prisma.curriculum.findMany();
  console.log('Total Curriculums in DB:', currs.length);
  currs.forEach(c => console.log(`CurrCode: ${c.curriculumCode}, DeptId: ${c.deptId}, FacId: ${c.facultyId}`));
}
check().finally(() => prisma.$disconnect());
