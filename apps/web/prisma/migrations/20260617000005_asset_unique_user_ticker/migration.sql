-- Migration: asset_unique_user_ticker
-- Troca @@index([user_id, ticker]) por @@unique([user_id, ticker]) no model Asset
-- Garante que um mesmo usuário não possa cadastrar o mesmo ticker duas vezes

-- DropIndex
DROP INDEX IF EXISTS "Asset_user_id_ticker_idx";

-- CreateIndex
CREATE UNIQUE INDEX "assets_user_id_ticker_key" ON "assets"("user_id", "ticker");
