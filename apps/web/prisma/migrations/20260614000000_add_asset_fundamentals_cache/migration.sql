-- CreateTable
CREATE TABLE "asset_fundamentals_cache" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "source" "DataSource" NOT NULL,
    "data" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_fundamentals_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_fundamentals_cache_symbol_source_key" ON "asset_fundamentals_cache"("symbol", "source");
