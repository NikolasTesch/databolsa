-- CreateTable
CREATE TABLE "benchmark_series_cache" (
    "id" TEXT NOT NULL,
    "series_key" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benchmark_series_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_series_cache_series_key_period_key" ON "benchmark_series_cache"("series_key", "period");
