#!/bin/bash
su - postgres -c "psql -d n11_db -c 'ALTER TABLE recipes ADD COLUMN IF NOT EXISTS scrap_percentage DOUBLE PRECISION NOT NULL DEFAULT 0; ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS scrap_percentage DOUBLE PRECISION NOT NULL DEFAULT 0;'"
