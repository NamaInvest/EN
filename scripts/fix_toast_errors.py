import os
import re

with open('tsc_output.txt', 'r', encoding='utf-16le') as f:
    text = f.read()

errors = re.findall(r'(src/app/\(dashboard\)/.*?\.tsx)\(\d+,\d+\): error TS2[0-9]+: Cannot find name \'(toastWarning|toastSuccess|toastError)\'', text)

files_to_fix = set(e[0] for e in errors)

for filepath in files_to_fix:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        continue
        
    # Check if we have some destructuring of useToast()
    destruct_match = re.search(r'const\s+\{.*\}\s*=\s*useToast\(\)', content)
    if destruct_match:
        # replace it with full destruct
        content = content[:destruct_match.start()] + "const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()" + content[destruct_match.end():]
    else:
        # No destructuring found. Add it inside the default export component.
        # Find export default function OR const Page = () =>
        func_match = re.search(r'(export default function [^{]+{|const [A-Za-z0-9_]+ = \(.*?\) => {)', content)
        if func_match:
            content = content[:func_match.end()] + "\n  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();\n" + content[func_match.end():]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Fixed {len(files_to_fix)} files.")
