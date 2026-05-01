#!/bin/bash
su - postgres -c "psql -d ahmedalyamicompany_db -c '\dp recipe_operations'"
su - postgres -c "psql -d ahmedalyamicompany_db -c '\dp manufacturing_costs'"
