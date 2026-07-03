-- CreateTable
CREATE TABLE "analysis_alert_rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" "AlertCondition" NOT NULL,
    "target_value" DECIMAL(18,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_alert_rules_user_id_idx" ON "analysis_alert_rules"("user_id");

-- AddForeignKey
ALTER TABLE "analysis_alert_rules" ADD CONSTRAINT "analysis_alert_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
