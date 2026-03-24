import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🗑️ Tearing down all database tables (Truncate Cascade)...');
  await prisma.$executeRaw`TRUNCATE TABLE 
    "Enrollment", 
    "AcademicRecord", 
    "Schedule", 
    "Section", 
    "SemesterConfig", 
    "CurriculumCourse", 
    "Curriculum", 
    "Prerequisite", 
    "Course", 
    "ProfessorProfile", 
    "StudentProfile", 
    "AdminProfile", 
    "User", 
    "Department", 
    "Faculty" 
    CASCADE`;

  console.log('✅ All data truncated successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error('❌ Deletion Error:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
