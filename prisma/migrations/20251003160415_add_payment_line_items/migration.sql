-- CreateTable
CREATE TABLE "PaymentLineItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "feeBreakdownId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLineItem_paymentId_idx" ON "PaymentLineItem"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentLineItem_feeBreakdownId_idx" ON "PaymentLineItem"("feeBreakdownId");

-- AddForeignKey
ALTER TABLE "PaymentLineItem" ADD CONSTRAINT "PaymentLineItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLineItem" ADD CONSTRAINT "PaymentLineItem_feeBreakdownId_fkey" FOREIGN KEY ("feeBreakdownId") REFERENCES "FeeBreakdown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
