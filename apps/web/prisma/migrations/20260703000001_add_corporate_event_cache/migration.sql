-- CreateTable
CREATE TABLE "corporate_event_cache" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "source" "DataSource" NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_date" DATE NOT NULL,
    "description" TEXT,
    "data" JSONB,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corporate_event_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "corporate_event_cache_symbol_event_type_event_date_key" ON "corporate_event_cache"("symbol", "event_type", "event_date");

-- CreateIndex
CREATE INDEX "corporate_event_cache_event_date_idx" ON "corporate_event_cache"("event_date");

-- CreateIndex
CREATE INDEX "corporate_event_cache_symbol_event_date_idx" ON "corporate_event_cache"("symbol", "event_date");
