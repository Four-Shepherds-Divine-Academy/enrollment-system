-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "isRefunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refundDate" TIMESTAMP(3),
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedBy" TEXT;

-- CreateIndex
CREATE INDEX "Payment_isRefunded_idx" ON "Payment"("isRefunded");
