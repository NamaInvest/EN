#!/usr/bin/env python3
"""Fix Arabic mojibake in TypeScript/TSX files.
Pattern: UTF-8 Arabic was decoded as Latin-1 then re-encoded, producing sequences like ط§ظ„
Fix: re-encode as latin-1 bytes then decode as utf-8.
"""

import os
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src')
EXTS = ('.ts', '.tsx')

def fix_mojibake(text: str) -> str:
    try:
        # Try to fix: encode back to latin-1 bytes, decode as utf-8
        fixed = text.encode('latin-1').decode('utf-8')
        return fixed
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text  # If it fails, return original

def has_mojibake(text: str) -> bool:
    # Mojibake Arabic: ط§ or ظ€ patterns
    suspicious = ['ط§', 'ط¨', 'ط©', 'طھ', 'ظ€', 'ظ‚', 'ظ…', 'ظ†', 'ط¬', 'ط­', 'طµ']
    return any(s in text for s in suspicious)

fixed_count = 0
skipped_count = 0

for dirpath, dirnames, filenames in os.walk(ROOT):
    # Skip node_modules and .next
    dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.next', '.git')]
    
    for fname in filenames:
        if not fname.endswith(EXTS):
            continue
        
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not has_mojibake(content):
                skipped_count += 1
                continue
            
            fixed = fix_mojibake(content)
            
            if fixed != content and not has_mojibake(fixed):
                with open(fpath, 'w', encoding='utf-8') as f:
                    f.write(fixed)
                print(f'FIXED: {fpath}')
                fixed_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            print(f'ERROR: {fpath}: {e}')

print(f'\nDone: fixed={fixed_count}, skipped={skipped_count}')
