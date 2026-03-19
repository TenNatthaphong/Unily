import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // 1. Import ตัวนี้
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 2. ตั้งค่า Configuration ของ Swagger
  const config = new DocumentBuilder()
    .setTitle('University Admin API')
    .setDescription('ระบบจัดการหลักสูตรและรายวิชา (Admin/Professor/Student)')
    .setVersion('1.0')
    .addTag('admin')      // แยกหมวดหมู่ API
    .addTag('courses')
    .addTag('curriculums')
    .addBearerAuth()      // สำหรับระบบ Login (ถ้ามี)
    .build();

  // 3. สร้าง Document
  const document = SwaggerModule.createDocument(app, config);

  // 4. กำหนด Path ที่จะเข้าดู (เช่น http://localhost:3333/docs)
  SwaggerModule.setup('docs', app, document);

  app.enableCors();
  await app.listen(3333);
  console.log(`Application is running on: ${await app.getUrl()}/docs`);
}
bootstrap();