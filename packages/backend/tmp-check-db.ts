import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const facCount = await prisma.faculty.count();
  const deptCount = await prisma.department.count();
  const currCount = await prisma.curriculum.count();
  console.log({ facCount, deptCount, currCount });
}
main();
