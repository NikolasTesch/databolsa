-- AlterTable: add optional monthly_income_goal to users
ALTER TABLE "users" ADD COLUMN "monthly_income_goal" DECIMAL(18,2);
