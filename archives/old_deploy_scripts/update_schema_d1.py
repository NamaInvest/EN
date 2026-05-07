with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update JournalEntry to include bookId
journal_entry_target = 'model JournalEntry {'
if 'bookId' not in content[content.index(journal_entry_target):content.index('}', content.index(journal_entry_target))]:
    # We find the end of JournalEntry model definition
    je_start = content.index(journal_entry_target)
    je_end = content.index('}', je_start)
    
    je_content = content[je_start:je_end]
    
    # insert before @@map if present, otherwise at the end
    insertion = """
  bookId       Int?      @map("book_id")
  book         AccountingBook? @relation(fields: [bookId], references: [id])
"""
    if '@@map' in je_content:
        map_index = je_content.index('@@map')
        new_je_content = je_content[:map_index] + insertion + je_content[map_index:]
    else:
        new_je_content = je_content + insertion
        
    content = content[:je_start] + new_je_content + content[je_end:]

# 2. Append AccountingBook and AccountMapping
new_models = """

// Phase D.1: Multi-Book / Multi-GAAP
model AccountingBook {
  id              Int      @id @default(autoincrement())
  code            String   @unique // IFRS, TAX, ZAKAT, MGMT
  baseCurrency    String   @map("base_currency")
  isPrimary       Boolean  @default(false) @map("is_primary")
  fiscalYearStart DateTime @map("fiscal_year_start")

  journalEntries  JournalEntry[]
  sourceMappings  AccountMapping[] @relation("SourceBook")
  targetMappings  AccountMapping[] @relation("TargetBook")

  @@map("accounting_books")
}

model AccountMapping {
  id              Int      @id @default(autoincrement())
  sourceBookId    Int      @map("source_book_id")
  targetBookId    Int      @map("target_book_id")
  sourceAccountId Int      @map("source_account_id")
  targetAccountId Int      @map("target_account_id")
  transformRule   String?  @map("transform_rule") // e.g., JSON rule for specific GAAP adjustments

  sourceBook      AccountingBook @relation("SourceBook", fields: [sourceBookId], references: [id])
  targetBook      AccountingBook @relation("TargetBook", fields: [targetBookId], references: [id])
  sourceAccount   Account        @relation("SourceAccount", fields: [sourceAccountId], references: [id])
  targetAccount   Account        @relation("TargetAccount", fields: [targetAccountId], references: [id])

  @@map("account_mappings")
}
"""

if 'model AccountingBook' not in content:
    content += new_models

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)
