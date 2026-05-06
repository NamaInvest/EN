import os
import re

directory = 'src/app/api'

# We look for hasPermission(..., ...,) and if it does not have `prisma` as third argument, add it.
pattern = re.compile(r'(hasPermission\s*\(\s*[^,]+,\s*[^,]+)\s*\)')

fixed_files = []

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(r'\1, prisma)', content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                fixed_files.append(path)

print("Fixed:", fixed_files)
