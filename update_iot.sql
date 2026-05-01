ALTER TABLE "machines" ADD COLUMN IF NOT EXISTS "energy_cost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "machines" ADD COLUMN IF NOT EXISTS "carbon_rate" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "machine_telemetry" (
    "id" SERIAL NOT NULL,
    "machine_id" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION,
    "vibration" DOUBLE PRECISION,
    "pieces_produced" INTEGER NOT NULL DEFAULT 0,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_telemetry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "traceability_logs" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "raw_batch_id" INTEGER,
    "finished_batch_id" INTEGER,
    "action" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traceability_logs_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'machine_telemetry_machine_id_fkey') THEN
        ALTER TABLE "machine_telemetry" ADD CONSTRAINT "machine_telemetry_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
