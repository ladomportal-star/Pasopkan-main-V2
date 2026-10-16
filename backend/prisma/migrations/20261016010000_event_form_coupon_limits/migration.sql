ALTER TABLE "Coupon"
  ADD COLUMN "maxUsesPerUser" INTEGER,
  ADD COLUMN "maxDiscountAmount" INTEGER;

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_maxUsesPerUser_positive" CHECK ("maxUsesPerUser" IS NULL OR "maxUsesPerUser" > 0),
  ADD CONSTRAINT "Coupon_maxDiscountAmount_positive" CHECK ("maxDiscountAmount" IS NULL OR "maxDiscountAmount" > 0);
