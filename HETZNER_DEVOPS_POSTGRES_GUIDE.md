# ⚠️ HETZNER & aaPanel PostgreSQL Architecture (CRITICAL DEVOPS RULE)

## The Dual PostgreSQL Isolation Rule
If you are managing the databases on the Nama Invest Hetzner Server, you MUST understand that there are **TWO** completely isolated PostgreSQL instances running simultaneously on the machine:

### 1. The Ghost Instance (Unix Socket - 5433)
**Access:** `sudo -u postgres psql`
**Status:** **EMPTY / GHOST DATABASE**
**Warning:** Never use this! Bypassing TCP via `sudo -u postgres` connects to an natively installed empty installation. If you run `pg_dump` or `CREATE DATABASE` here, you are manipulating an empty ghost universe. Your Node.js apps will NOT see these changes.

### 2. The True Production Instance (TCP - 5432)
**Access:** `psql -h localhost -p 5432 -U postgres` (Password: `n1_pass123`)
**Status:** **REAL DATA (121+ Tables, e.g., n11_db, n1_db)**
**Rule:** All Node.js, Prisma, PM2, and pg_dump operations **MUST strictly specify `-h localhost -p 5432`**. AAPanel or Docker routes Port `5432` strictly to the true populated database instance.

### Master Rules for Remote Execution:
✅ **Correct Query:** `PGPASSWORD="n1_pass123" psql -h localhost -p 5432 -U postgres -d n1_db -c "..."`
❌ **Wrong Query:** `sudo -u postgres psql -c "..."`

✅ **Dumping Data correctly:** `PGPASSWORD="n1_pass123" pg_dump -h localhost -p 5432 -U postgres -d n11_db -F c -f /tmp/backup.dump`
❌ **Dumping Ghost Data:** `sudo -u postgres pg_dump -d n11_db -F c -f /tmp/backup.dump`

### Note on Backups
When cloning nodes (e.g. N11 to N7), ALWAYS execute drops, role creations, and `pg_restore` explicitly over `-h localhost -p 5432` using the `postgres` user.
