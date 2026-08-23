-- AlterTable: Add password column to User table for native bcrypt auth
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
