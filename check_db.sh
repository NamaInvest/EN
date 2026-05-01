#!/bin/bash
su - postgres -c "psql -d n11_db -c '\d recipes'"
su - postgres -c "psql -d n11_db -c '\d recipe_ingredients'"
