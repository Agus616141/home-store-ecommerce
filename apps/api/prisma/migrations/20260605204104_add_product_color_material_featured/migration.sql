-- AlterTable
ALTER TABLE "products" ADD COLUMN     "color" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "material" TEXT;

-- CreateIndex
CREATE INDEX "products_isFeatured_isActive_idx" ON "products"("isFeatured", "isActive");
