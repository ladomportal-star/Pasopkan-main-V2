ALTER TABLE "User" ADD COLUMN "publicId" VARCHAR(16);

CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");
