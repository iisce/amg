UPDATE "Booking" SET "subtotal" = "totalAmount" WHERE "subtotal" = 0;
UPDATE "Membership" SET "subtotal" = "totalAmount" WHERE "subtotal" = 0;
UPDATE "Payment" SET "subtotal" = "amount" WHERE "subtotal" = 0;
