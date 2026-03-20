/*
  Warnings:

  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Curriculum` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Curriculum` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[courseCode]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[curriculumCode]` on the table `Curriculum` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `courseId` on the `AcademicRecord` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `courseCode` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `curriculumCode` to the `Curriculum` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `curriculumId` on the `CurriculumCourse` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `CurriculumCourse` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `Prerequisite` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `requiresCourseId` on the `Prerequisite` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `courseId` on the `Section` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "AcademicRecord" DROP CONSTRAINT "AcademicRecord_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CurriculumCourse" DROP CONSTRAINT "CurriculumCourse_courseId_fkey";

-- DropForeignKey
ALTER TABLE "CurriculumCourse" DROP CONSTRAINT "CurriculumCourse_curriculumId_fkey";

-- DropForeignKey
ALTER TABLE "Prerequisite" DROP CONSTRAINT "Prerequisite_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Prerequisite" DROP CONSTRAINT "Prerequisite_requiresCourseId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_courseId_fkey";

-- AlterTable
ALTER TABLE "AcademicRecord" DROP COLUMN "courseId",
ADD COLUMN     "courseId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
ADD COLUMN     "courseCode" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Curriculum" DROP CONSTRAINT "Curriculum_pkey",
ADD COLUMN     "curriculumCode" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CurriculumCourse" DROP COLUMN "curriculumId",
ADD COLUMN     "curriculumId" UUID NOT NULL,
DROP COLUMN "courseId",
ADD COLUMN     "courseId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Prerequisite" DROP COLUMN "courseId",
ADD COLUMN     "courseId" UUID NOT NULL,
DROP COLUMN "requiresCourseId",
ADD COLUMN     "requiresCourseId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "courseId",
ADD COLUMN     "courseId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Course_courseCode_key" ON "Course"("courseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_curriculumCode_key" ON "Curriculum"("curriculumCode");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumCourse_curriculumId_courseId_key" ON "CurriculumCourse"("curriculumId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Prerequisite_courseId_requiresCourseId_key" ON "Prerequisite"("courseId", "requiresCourseId");

-- AddForeignKey
ALTER TABLE "Prerequisite" ADD CONSTRAINT "Prerequisite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prerequisite" ADD CONSTRAINT "Prerequisite_requiresCourseId_fkey" FOREIGN KEY ("requiresCourseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
