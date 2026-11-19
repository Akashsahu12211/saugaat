-- Rate-limit authentication attempts across stateless Vercel instances.
-- Additive only; no existing tables or data changed.
CREATE TABLE "AuthThrottle" (
  "id" VARCHAR(64) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuthThrottle_resetAt_idx" ON "AuthThrottle"("resetAt");
