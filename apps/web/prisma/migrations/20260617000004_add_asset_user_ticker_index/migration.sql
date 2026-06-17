-- Migration: add composite index on Asset(user_id, ticker)
-- Acelera a query mais frequente do sistema: filtro por usuário e ticker (RN-11)
CREATE INDEX IF NOT EXISTS "Asset_user_id_ticker_idx" ON "assets"("user_id", "ticker");
