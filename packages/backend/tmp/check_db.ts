import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const facCount = await prisma.faculty.count();
  const deptCount = await prisma.department.count();
  const currCount = await prisma.curriculum.count();
  console.log(`Faculties: ${facCount}`);
  console.log(`Departments: ${deptCount}`);
  console.log(`Curriculums: ${currCount}`);
}

main().catch(console.error).finally(() => pool.end());
