-- Adds the owner's reply text to a message (idempotent).
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "reply" TEXT;
