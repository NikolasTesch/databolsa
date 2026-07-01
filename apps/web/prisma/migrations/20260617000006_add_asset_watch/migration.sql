-- CreateTable
CREATE TABLE "asset_watch" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "asset_class" "AssetClass" NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_watch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_watch_user_id_ticker_key" ON "asset_watch"("user_id", "ticker");

-- AddForeignKey
ALTER TABLE "asset_watch" ADD CONSTRAINT "asset_watch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
