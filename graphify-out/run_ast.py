import sys, json, os
from graphify.extract import collect_files, extract
from pathlib import Path

# Limit workers to avoid OOM
os.environ['GRAPHIFY_MAX_WORKERS'] = '2'

code_files = []
detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text())
for f in detect.get('files', {}).get('code', []):
    p = Path(f)
    if p.is_dir():
        code_files.extend(collect_files(p))
    else:
        code_files.append(p)

print(f"Processing {len(code_files)} code files with limited workers...")

if code_files:
    try:
        result = extract(code_files, max_workers=1)
    except TypeError:
        # If max_workers param not supported, try default
        result = extract(code_files)
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2))
    n = len(result["nodes"])
    e = len(result["edges"])
    print(f"AST: {n} nodes, {e} edges")
else:
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}))
    print('No code files - skipping AST extraction')
