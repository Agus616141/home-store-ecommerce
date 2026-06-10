-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'STANDARD';
