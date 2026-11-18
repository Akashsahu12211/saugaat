-- Initial Saugaat Prisma schema for a fresh, empty staging DB.
-- Generated from the main-branch Prisma schema, validated on a Neon temporary branch.
-- The database owner must review before promotion. No data-deleting statements.
CREATE TYPE "EventVisibility" AS ENUM ('PRIVATE', 'LINK_ONLY');

CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'PURCHASED', 'CANCELLED', 'EXPIRED');

CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "RSVPStatus" AS ENUM ('PENDING', 'ATTENDING', 'DECLINED');

CREATE TYPE "EventRole" AS ENUM ('HOST', 'COHOST');

CREATE TYPE "FundStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE "ContributionStatus" AS ENUM ('PLEDGED', 'PAYMENT_PENDING', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED');

CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'MODERATOR');

CREATE TYPE "ReportReason" AS ENUM ('PRIVACY', 'INAPPROPRIATE_MEDIA', 'SPAM', 'OTHER');

CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" VARCHAR(1500),
  "occasion" TEXT NOT NULL,
  "location" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "visibility" "EventVisibility" NOT NULL DEFAULT 'PRIVATE',
  "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
  "accessCodeHash" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventMember" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "EventRole" NOT NULL DEFAULT 'COHOST',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventInvite" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gift" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "pricePaise" INTEGER,
  "category" TEXT,
  "note" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 2,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reservation" (
  "id" TEXT NOT NULL,
  "giftId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "guestUserId" TEXT,
  "visitorId" TEXT,
  "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Guest" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "rsvp" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
  "visitorId" TEXT,
  "partySize" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Media" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "uploaderId" TEXT,
  "visitorId" TEXT,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "fileName" VARCHAR(160) NOT NULL,
  "album" VARCHAR(60) NOT NULL DEFAULT 'Moments',
  "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
  "uploadedAt" TIMESTAMP(3),
  "uploadExpiresAt" TIMESTAMP(3) NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvitationLink" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "label" VARCHAR(80) NOT NULL,
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "maxUses" INTEGER,
  "useCount" INTEGER NOT NULL DEFAULT 0,
  "revokedAt" TIMESTAMP(3),
  "allowMediaView" BOOLEAN NOT NULL DEFAULT false,
  "allowMediaUpload" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvitationLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "userId" TEXT NOT NULL,
  "emailUpdates" BOOLEAN NOT NULL DEFAULT false,
  "whatsappUpdates" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "GiftFund" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "giftId" TEXT NOT NULL,
  "targetPaise" INTEGER NOT NULL,
  "status" "FundStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GiftFund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contribution" (
  "id" TEXT NOT NULL,
  "fundId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "visitorId" TEXT,
  "guestUserId" TEXT,
  "amountPaise" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "status" "ContributionStatus" NOT NULL DEFAULT 'PLEDGED',
  "providerOrderId" VARCHAR(100),
  "providerPaymentId" VARCHAR(100),
  "paidAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentWebhookReceipt" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'RAZORPAY_TEST',
  "providerEventId" VARCHAR(130) NOT NULL,
  "eventType" VARCHAR(80) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentWebhookReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAccount" (
  "userId" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "AbuseReport" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "mediaId" TEXT,
  "reporterFingerprint" VARCHAR(64) NOT NULL,
  "reason" "ReportReason" NOT NULL,
  "details" VARCHAR(600),
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "reviewerId" TEXT,
  "resolutionNote" VARCHAR(300),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AbuseReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "targetType" VARCHAR(40) NOT NULL,
  "targetId" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

CREATE INDEX "Event_ownerId_idx" ON "Event"("ownerId");

CREATE UNIQUE INDEX "EventMember_eventId_userId_key" ON "EventMember"("eventId", "userId");

CREATE INDEX "EventMember_userId_idx" ON "EventMember"("userId");

CREATE UNIQUE INDEX "EventInvite_eventId_email_key" ON "EventInvite"("eventId", "email");

CREATE INDEX "EventInvite_email_idx" ON "EventInvite"("email");

CREATE INDEX "Gift_eventId_idx" ON "Gift"("eventId");

CREATE INDEX "Reservation_giftId_status_idx" ON "Reservation"("giftId", "status");

CREATE INDEX "Reservation_giftId_visitorId_status_idx" ON "Reservation"("giftId", "visitorId", "status");

CREATE INDEX "Reservation_eventId_idx" ON "Reservation"("eventId");

CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");

CREATE UNIQUE INDEX "Guest_eventId_visitorId_key" ON "Guest"("eventId", "visitorId");

CREATE UNIQUE INDEX "Media_storageKey_key" ON "Media"("storageKey");

CREATE INDEX "Media_eventId_status_uploadedAt_idx" ON "Media"("eventId", "status", "uploadedAt");

CREATE INDEX "Media_visitorId_eventId_idx" ON "Media"("visitorId", "eventId");

CREATE UNIQUE INDEX "InvitationLink_tokenHash_key" ON "InvitationLink"("tokenHash");

CREATE INDEX "InvitationLink_eventId_revokedAt_idx" ON "InvitationLink"("eventId", "revokedAt");

CREATE UNIQUE INDEX "GiftFund_giftId_key" ON "GiftFund"("giftId");

CREATE INDEX "GiftFund_eventId_status_idx" ON "GiftFund"("eventId", "status");

CREATE UNIQUE INDEX "Contribution_providerOrderId_key" ON "Contribution"("providerOrderId");

CREATE UNIQUE INDEX "Contribution_providerPaymentId_key" ON "Contribution"("providerPaymentId");

CREATE INDEX "Contribution_fundId_status_idx" ON "Contribution"("fundId", "status");

CREATE INDEX "Contribution_visitorId_fundId_idx" ON "Contribution"("visitorId", "fundId");

CREATE UNIQUE INDEX "PaymentWebhookReceipt_providerEventId_key" ON "PaymentWebhookReceipt"("providerEventId");

CREATE INDEX "AbuseReport_status_createdAt_idx" ON "AbuseReport"("status", "createdAt");

CREATE INDEX "AbuseReport_eventId_status_idx" ON "AbuseReport"("eventId", "status");

CREATE INDEX "AbuseReport_reporterFingerprint_createdAt_idx" ON "AbuseReport"("reporterFingerprint", "createdAt");

CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

ALTER TABLE "Event" ADD CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Gift" ADD CONSTRAINT "Gift_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Media" ADD CONSTRAINT "Media_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Media" ADD CONSTRAINT "Media_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvitationLink" ADD CONSTRAINT "InvitationLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvitationLink" ADD CONSTRAINT "InvitationLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GiftFund" ADD CONSTRAINT "GiftFund_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GiftFund" ADD CONSTRAINT "GiftFund_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "GiftFund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_guestUserId_fkey" FOREIGN KEY ("guestUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminAccount" ADD CONSTRAINT "AdminAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
