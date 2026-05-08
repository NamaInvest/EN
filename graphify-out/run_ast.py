"""AST extraction with proper Windows multiprocessing guard."""
import sys, json, os, multiprocessing
from graphify.extract import collect_files, extract
from pathlib import Path

def main():
    detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
    code_files = []
    for f in detect.get('files', {}).get('code', []):
        p = Path(f)
        if p.is_dir():
            code_files.extend(collect_files(p))
        else:
            code_files.append(p)

    print(f"Processing {len(code_files)} code files...")

    if not code_files:
        Path('graphify-out/.graphify_ast.json').write_text(
            json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}))
        print('No code files - skipping AST extraction')
        return

    result = extract(code_files)
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2))
    n = len(result["nodes"])
    e = len(result["edges"])
    print(f"AST: {n} nodes, {e} edges")

if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()
