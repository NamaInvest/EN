import json
from graphify.detect import detect
from pathlib import Path

result = detect(Path('.'))
Path('graphify-out/.graphify_detect.json').write_text(json.dumps(result, indent=2))
total = result.get('total_files', 0)
words = result.get('total_words', 0)
print(f"Detected: {total} files, ~{words:,} words")
for ftype, flist in result.get('files', {}).items():
    if flist:
        print(f"  {ftype}: {len(flist)}")
