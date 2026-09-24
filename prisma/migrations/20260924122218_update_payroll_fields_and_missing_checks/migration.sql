/*
  Warnings:

  - You are about to drop the column `net_pay` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `period_end` on the `payrolls` table. All the data in the column will be lost.
  - You are about to drop the column `period_start` on the `payrolls` table. All the data in the column will be lost.
  - Added the required column `pay_period_end` to the `payrolls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pay_period_start` to the `payrolls` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "payrolls" DROP COLUMN "net_pay",
DROP COLUMN "period_end",
DROP COLUMN "period_start",
ADD COLUMN     "bonuses" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pay_period_end" DATE NOT NULL,
ADD COLUMN     "pay_period_start" DATE NOT NULL,
ADD COLUMN     "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "total_salary" DECIMAL(10,2) GENERATED ALWAYS AS ("base_salary" + "bonuses" - "deductions") STORED;

-- Missing CHECK constraints per SRS
ALTER TABLE "job_titles" ADD CONSTRAINT check_salary_min_positive CHECK (salary_range_min > 0);
ALTER TABLE "payrolls" ADD CONSTRAINT check_base_salary_positive CHECK (base_salary > 0);
ALTER TABLE "payrolls" ADD CONSTRAINT check_bonuses_non_negative CHECK (bonuses >= 0);
ALTER TABLE "payrolls" ADD CONSTRAINT check_deductions_non_negative CHECK (deductions >= 0);
