const fs = require('fs');
const bcrypt = require('bcrypt');

const fileName = 'users_50k_hashed.csv';
const stream = fs.createWriteStream(fileName);

// Header
const header = 'email,firstName,lastName,role,password,studentCode,facultyId,deptId,entryYear,year,gpax,studentStatus\n';
stream.write(header);

const faculties = ['04', '08', '02', '01'];
const depts = ['01', '02', '03', '06'];

// ฟังก์ชันจำลองการหาปีและชั้นปี
function getYearDetails(index) {
  if (index % 4 === 0) return { entry: '2569', year: 1 };
  if (index % 4 === 1) return { entry: '2568', year: 2 };
  if (index % 4 === 2) return { entry: '2567', year: 3 };
  return { entry: '2566', year: 4 };
}

async function generate() {
  console.log('⏳ Generating 50,000 users with Hashed Passwords...');
  console.log('Note: This might take a few minutes because of bcrypt hashing.');

  for (let i = 1; i <= 50000; i++) {
    let role = 'STUDENT';
    let facId = faculties[Math.floor(Math.random() * faculties.length)];
    let deptId = depts[Math.floor(Math.random() * depts.length)];
    let { entry, year } = getYearDetails(i);
    
    // 1. สร้างรหัส 13 หลัก (ใช้ i เติม 0 ข้างหน้าให้ครบ)
    const studentCode = `6${entry.slice(-1)}${facId}${deptId}${i.toString().padStart(6, '0')}`;
    
    // 2. ข้อมูล Email และ Password (ตามโจทย์)
    let email = `u${studentCode}@unily.ac.th`;
    let rawPassword = `unily${studentCode}`;
    
    if (i <= 2) {
        role = 'ADMIN';
        email = `admin${i}@unily.ac.th`;
        rawPassword = `adminpassword${i}`;
    } else if (i <= 202) {
        role = 'PROFESSOR';
        email = `prof${i}@unily.ac.th`;
        rawPassword = `profpassword${i}`;
    }

    // 3. Hash Password (ทำตอนนี้เลยเพื่อประหยัดเวลาตอน Import)
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const row = [
      email,
      `FirstName${i}`,
      `LastName${i}`,
      role,
      hashedPassword, // ใส่ตัวที่ Hash แล้วลง CSV
      role === 'STUDENT' ? studentCode : '',
      facId,
      deptId,
      role === 'STUDENT' ? entry : '',
      role === 'STUDENT' ? year : '',
      role === 'STUDENT' ? '0.00' : '',
      role === 'STUDENT' ? 'STUDYING' : ''
    ].join(',');

    stream.write(row + '\n');
    
    if (i % 5000 === 0) console.log(`--- Generated ${i} users ---`);
  }

  stream.end();
  console.log(`✅ Done! File saved as ${fileName}`);
}

generate();