"""
Revert the catch (err: unknown) changes which break code that uses err.message, err.stack etc.
Instead use catch (err: any) which is safe in TypeScript.
"""
import re, sys, io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ROOT = Path.cwd()
SRC  = ROOT / 'src'

fixed = 0
for path in SRC.rglob('*.ts'):
    if not path.is_file():
        continue
    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
        original = content

        # Revert: catch (err: unknown) -> catch (err: any)
        content = content.replace('} catch (err: unknown) {', '} catch (err: any) {')
        content = content.replace('} catch (error: unknown) {', '} catch (error: any) {')
        content = content.replace('} catch (e: unknown) {', '} catch (e: any) {')
        content = content.replace('} catch (ex: unknown) {', '} catch (ex: any) {')

        # Revert bad .catch() changes
        content = re.sub(r'\.catch\(\((\w+): unknown\) =>', r'.catch((\1: any) =>', content)
        content = re.sub(r'\.catch\((\w+): unknown\)', r'.catch((\1: any)', content)

        if content != original:
            path.write_text(content, encoding='utf-8')
            fixed += 1
    except Exception:
        continue

print(f'Reverted catch unknown -> catch any in {fixed} files')
