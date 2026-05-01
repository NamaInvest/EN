CREATE TABLE IF NOT EXISTS "quality_checks" (
    "id" SERIAL NOT NULL,
    "manufacturing_order_id" INTEGER NOT NULL,
    "inspector_name" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "machine_maintenance" (
    "id" SERIAL NOT NULL,
    "machine_id" INTEGER NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "completed_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_maintenance_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quality_checks_manufacturing_order_id_fkey') THEN
        ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_manufacturing_order_id_fkey" FOREIGN KEY ("manufacturing_order_id") REFERENCES "manufacturing_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'machine_maintenance_machine_id_fkey') THEN
        ALTER TABLE "machine_maintenance" ADD CONSTRAINT "machine_maintenance_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
