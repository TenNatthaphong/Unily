const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const pg = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function generateCsv() {
  const fileName = 'users_50k.csv';
  const stream = fs.createWriteStream(fileName);

  const header = 'email,firstName,lastName,role,password,studentCode,facultyId,deptId,entryYear,year,gpax,studentStatus\n';
  stream.write(header);

  // Fetch exact UUIDs and Codes to match strictly with schema relationships
  const faculties = await prisma.faculty.findMany();
  const depts = await prisma.department.findMany();

  if (faculties.length === 0 || depts.length === 0) {
    console.error('❌ Please seed or create Faculty and Department first!');
    return;
  }

  console.log('⏳ Generating 50,000 users...');

  for (let i = 1; i <= 50000; i++) {
    let role = 'STUDENT';
    let studentCode = '';
    
    const randomFac = faculties[Math.floor(Math.random() * faculties.length)];
    const randomDept = depts[Math.floor(Math.random() * depts.length)];

    let facId = randomFac.id;           // Using real UUID
    let deptId = randomDept.id;         // Using real UUID
    let facCode = randomFac.facultyCode;
    let deptCode = randomDept.deptCode;
    let entryYear = '2566';

    if (i <= 2) {
      role = 'ADMIN';
      facId = ''; deptId = ''; entryYear = ''; 
    } else if (i <= 202) {
      role = 'PROFESSOR';
      entryYear = ''; 
    } else {
      // e.g. 66040600003
      studentCode = `66${facCode}${deptCode}${i.toString().padStart(5, '0')}`;
    }

    const row = [
      `user${i}@kmutnb.ac.th`,        // email
      `FirstName${i}`,               // firstName
      `LastName${i}`,                // lastName
      role,                          // role
      'password123',                 // password
      studentCode,                   // studentCode
      facId,                         // facultyId
      deptId,                        // deptId
      entryYear,                     // entryYear
      role === 'STUDENT' ? '1' : '', // year
      role === 'STUDENT' ? '0.00' : '', // gpax
      role === 'STUDENT' ? 'STUDYING' : '' // studentStatus
    ].join(',');

    stream.write(row + '\n');
  }

  stream.end();
  console.log(`✅ Done! File saved as ${fileName}`);
}

generateCsv().catch(console.error).finally(() => prisma.$disconnect());