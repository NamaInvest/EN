# fix_graphify_line.py — fixes the problematic f-string on line 224 of graphify.py
with open('graphify.py', encoding='utf-8') as f:
    lines = f.readlines()

# Replace the bad line (0-indexed = 223)
bad_line = lines[223]
if 'group_rows' in bad_line:
    lines[223] = (
        'group_rows = "".join(\n'
        '    "<tr><td><span class=dot style=background:" + GROUP_COLORS.get(g, "#6b7280") + "></span>" + g + "</td><td>" + str(cnt) + "</td></tr>"\n'
        '    for g, cnt in sorted(stats["by_group"].items(), key=lambda x: -x[1])[:20])\n'
    )
    print(f'Fixed line 224. Was: {bad_line[:60]}...')
else:
    print(f'Line 224 content: {bad_line[:80]}')

with open('graphify.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Saved.')
