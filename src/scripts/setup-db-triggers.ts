import { PrismaClient } from '@prisma/client';

// Use a simple console.log to avoid complex logger dependencies in standalone scripts
console.log('Setting up enterprise database triggers...');

const prisma = new PrismaClient();

async function main() {
    console.log('Applying Immutable Ledger Triggers...');

    // 1. Immutable Ledger Trigger (Journal Entries)
    // Prevents UPDATE or DELETE if the OLD status was 'posted'
    await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION prevent_posted_journal_update()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Allow updates to 'posted' status, but reject changes if ALREADY 'posted'
            IF OLD.status = 'posted' THEN
                -- Only exception: maybe soft-delete, but for pure immutable ledgers, we forbid it.
                RAISE EXCEPTION 'IMMUTABLE_LEDGER_VIOLATION: Cannot update or delete a posted JournalEntry (ID: %)', OLD.id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_prevent_posted_journal_update ON journal_entries;`);
    await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trg_prevent_posted_journal_update
        BEFORE UPDATE OR DELETE ON journal_entries
        FOR EACH ROW EXECUTE FUNCTION prevent_posted_journal_update();
    `);

    // 2. Prevent Journal Line updates if parent is posted
    await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION prevent_posted_journal_line_update()
        RETURNS TRIGGER AS $$
        DECLARE
            parent_status VARCHAR;
        BEGIN
            SELECT status INTO parent_status FROM journal_entries WHERE id = OLD.journal_entry_id;
            
            IF parent_status = 'posted' THEN
                RAISE EXCEPTION 'IMMUTABLE_LEDGER_VIOLATION: Cannot update or delete a JournalLine belonging to a posted JournalEntry';
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_prevent_posted_journal_line_update ON journal_lines;`);
    await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trg_prevent_posted_journal_line_update
        BEFORE UPDATE OR DELETE ON journal_lines
        FOR EACH ROW EXECUTE FUNCTION prevent_posted_journal_line_update();
    `);

    console.log('Database triggers setup complete.');
}

main()
    .catch((e) => {
        console.error('Error setting up triggers:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
