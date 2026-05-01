ALTER TABLE recipes ADD COLUMN IF NOT EXISTS scrap_percentage DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS scrap_percentage DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE manufacturing_orders ADD COLUMN IF NOT EXISTS wip_account_id INTEGER;

CREATE TABLE IF NOT EXISTS "work_centers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "cost_per_hour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "machine_id" INTEGER,

    CONSTRAINT "work_centers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "work_centers_code_key" ON "work_centers"("code");

CREATE TABLE IF NOT EXISTS "recipe_operations" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "work_center_id" INTEGER NOT NULL,
    "operation_name" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "duration_minutes" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_operations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "recipe_byproducts" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost_share_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_byproducts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "manufacturing_costs" (
    "id" SERIAL NOT NULL,
    "manufacturing_order_id" INTEGER NOT NULL,
    "costType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturing_costs_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'work_centers_machine_id_fkey') THEN
        ALTER TABLE "work_centers" ADD CONSTRAINT "work_centers_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_operations_recipe_id_fkey') THEN
        ALTER TABLE "recipe_operations" ADD CONSTRAINT "recipe_operations_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_operations_work_center_id_fkey') THEN
        ALTER TABLE "recipe_operations" ADD CONSTRAINT "recipe_operations_work_center_id_fkey" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_byproducts_recipe_id_fkey') THEN
        ALTER TABLE "recipe_byproducts" ADD CONSTRAINT "recipe_byproducts_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_byproducts_product_id_fkey') THEN
        ALTER TABLE "recipe_byproducts" ADD CONSTRAINT "recipe_byproducts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manufacturing_costs_manufacturing_order_id_fkey') THEN
        ALTER TABLE "manufacturing_costs" ADD CONSTRAINT "manufacturing_costs_manufacturing_order_id_fkey" FOREIGN KEY ("manufacturing_order_id") REFERENCES "manufacturing_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
