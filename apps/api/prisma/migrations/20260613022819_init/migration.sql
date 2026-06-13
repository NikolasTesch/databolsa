-- CreateEnum
CREATE TYPE "AssetClass" AS ENUM ('STOCK_BR', 'FII', 'ETF', 'BDR', 'CRYPTO', 'STOCK_US');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BRL', 'USD');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('BRAPI', 'COINGECKO', 'FINNHUB');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asset_class" "AssetClass" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BRL',
    "data_source" "DataSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "date" DATE NOT NULL,
    "unit_price" DECIMAL(18,8) NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "fees" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_cache" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "source" "DataSource" NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "quote_cache_symbol_source_key" ON "quote_cache"("symbol", "source");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
