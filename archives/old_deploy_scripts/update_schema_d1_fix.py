with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the duplicate AccountMapping array in Account model
content = content.replace(
    'AccountMapping AccountMapping[]',
    ''
)

# Find the end of Account model
account_target = 'model Account {'
if account_target in content:
    account_start = content.index(account_target)
    account_end = content.index('}', account_start)
    
    account_content = content[account_start:account_end]
    
    insertion = """
  sourceMappings AccountMapping[] @relation("SourceAccount")
  targetMappings AccountMapping[] @relation("TargetAccount")
"""
    if '@@map' in account_content:
        map_index = account_content.index('@@map')
        new_account_content = account_content[:map_index] + insertion + account_content[map_index:]
    else:
        new_account_content = account_content + insertion
        
    content = content[:account_start] + new_account_content + content[account_end:]

with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)
