const fs = require('fs');
const path = require('path');

try {
    const jsonPath = 'c:\\AllProject\\unily\\packages\\backend\\prisma\\courses.json';
    console.log('Target path:', jsonPath);
    
    if (!fs.existsSync(jsonPath)) {
        console.error('File does not exist!');
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    console.log('Read file, length:', rawData.length);
    
    const courses = JSON.parse(rawData);
    console.log('Parsed courses, count:', courses.length);

    const seenWildcards = new Set();
    const cleanedCourses = [];

    for (const course of courses) {
        const codeValue = course.code || course.id;
        if (!codeValue) continue;

        if (course.isWildcard) {
            let baseCode = codeValue.replace(/-\d+$/, '').replace(/X+$/, '');
            if (!seenWildcards.has(baseCode)) {
                seenWildcards.add(baseCode);
                cleanedCourses.push({
                    ...course,
                    code: baseCode,
                    id: baseCode
                });
                console.log('Keeping wildcard:', baseCode);
            }
        } else {
            cleanedCourses.push({
                ...course,
                code: codeValue,
                id: codeValue
            });
        }
    }

    const outputData = JSON.stringify(cleanedCourses, null, 2);
    fs.writeFileSync(jsonPath, outputData, 'utf8');
    console.log('Finished writing. New count:', cleanedCourses.length, 'New size:', outputData.length);
} catch (err) {
    console.error('Error occurred:', err);
    process.exit(1);
}
