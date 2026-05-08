"""
graphify.py — Builds a navigable knowledge graph for d:/namasoft9-3-main

Produces:  graph/index.html  (self-contained, no server needed)
           graph/graph.json  (raw node/edge data)

Nodes:
  - lib modules (src/lib/*.ts)
  - API routes (src/app/api/**/route.ts)
  - Pages (src/app/**/page.tsx)
  - Config files (prisma/schema.prisma, instrumentation.ts, etc.)

Edges:
  - import relationships (static analysis)
  - file-level groupings (accounting, hr, zatca, etc.)
"""

import os, re, json, html
from pathlib import Path

ROOT = Path(__file__).parent
SRC  = ROOT / 'src'

# ── 1. Collect nodes ─────────────────────────────────────────────────────────

nodes = {}   # id → {id, label, group, path, type}
edges = []   # {from, to, label}
node_id_map = {}  # relative path → id

def register(rel_path: str, label: str, group: str, ntype: str) -> str:
    if rel_path in node_id_map:
        return node_id_map[rel_path]
    nid = str(len(nodes))
    nodes[nid] = {'id': nid, 'label': label, 'group': group, 'path': rel_path, 'type': ntype}
    node_id_map[rel_path] = nid
    return nid

def categorize(rel: str) -> str:
    parts = rel.lower().split(os.sep)
    for kw in ['zatca', 'queue', 'event', 'mfa', 'auth', 'prisma', 'logger', 'rate',
                'vector', 'ai', 'pdf', 'email', 'cloud', 'translation']:
        if any(kw in p for p in parts):
            return kw.capitalize()
    if 'accounting' in parts: return 'Accounting'
    if 'hr' in parts: return 'HR'
    if 'sales' in parts: return 'Sales'
    if 'purchases' in parts or 'purchasing' in parts: return 'Purchasing'
    if 'inventory' in parts or 'stock' in parts: return 'Inventory'
    if 'manufacturing' in parts: return 'Manufacturing'
    if 'treasury' in parts or 'bank' in parts: return 'Finance'
    if 'finance' in parts or 'fng' in parts: return 'Finance'
    if 'crm' in parts: return 'CRM'
    if 'api' in parts: return 'API'
    if 'lib' in parts: return 'Lib'
    if 'app' in parts: return 'Pages'
    return 'Other'

# Register key config files
for extra in ['instrumentation.ts', 'prisma/schema.prisma', 'package.json', 'tsconfig.json']:
    p = ROOT / extra
    if p.exists():
        rel = str(p.relative_to(ROOT))
        register(rel, p.name, 'Config', 'config')

# Walk all .ts/.tsx files
for path in SRC.rglob('*'):
    if not path.is_file():
        continue
    if path.suffix not in ('.ts', '.tsx'):
        continue
    rel = str(path.relative_to(ROOT))
    name = path.name
    group = categorize(rel)

    if 'route.ts' in name:
        ntype = 'api'
        try:
            label = str(path.parent.relative_to(SRC / 'app' / 'api')).replace(os.sep, '/')
            label = '/' + label
        except ValueError:
            label = path.stem
    elif 'page.tsx' in name:
        ntype = 'page'
        try:
            label = str(path.parent.relative_to(SRC / 'app')).replace(os.sep, '/')
            label = '~/' + label
        except ValueError:
            label = name
    elif str(path).startswith(str(SRC / 'lib')):
        ntype = 'lib'
        label = path.stem
    else:
        ntype = 'other'
        label = name

    register(rel, label, group, ntype)

print(f'Registered {len(nodes)} nodes')

# ── 2. Collect edges (import analysis) ───────────────────────────────────────

IMPORT_RE = re.compile(r"""from\s+['"](@/lib/[^'"]+|@/app/[^'"]+|\./[^'"]+|\.\./[^'"]+)['"]""")

def resolve_import(current_file: Path, import_path: str) -> str | None:
    """Resolve an import path to a relative path from ROOT."""
    if import_path.startswith('@/'):
        # @/lib/foo → src/lib/foo
        resolved = SRC / import_path[2:]
    else:
        resolved = (current_file.parent / import_path).resolve()

    # Try with extensions
    for ext in ['.ts', '.tsx', '/index.ts', '/index.tsx', '.ts']:
        candidate = Path(str(resolved) + ext) if not str(resolved).endswith(ext) else resolved
        if candidate.exists():
            try:
                return str(candidate.relative_to(ROOT))
            except ValueError:
                pass
    return None

checked = 0
for path in SRC.rglob('*'):
    if not path.is_file() or path.suffix not in ('.ts', '.tsx'):
        continue
    rel = str(path.relative_to(ROOT))
    if rel not in node_id_map:
        continue
    src_id = node_id_map[rel]

    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        continue

    for match in IMPORT_RE.finditer(content):
        imp = match.group(1)
        target_rel = resolve_import(path, imp)
        if target_rel and target_rel in node_id_map:
            dst_id = node_id_map[target_rel]
            if src_id != dst_id:
                edges.append({'from': src_id, 'to': dst_id})
    checked += 1

# Deduplicate edges
seen = set()
unique_edges = []
for e in edges:
    key = (e['from'], e['to'])
    if key not in seen:
        seen.add(key)
        unique_edges.append(e)
edges = unique_edges

print(f'Analyzed {checked} files, found {len(edges)} import edges')

# ── 3. Export JSON ────────────────────────────────────────────────────────────

GRAPH_DIR = ROOT / 'graph'
GRAPH_DIR.mkdir(exist_ok=True)

graph_data = {
    'nodes': list(nodes.values()),
    'edges': edges,
    'stats': {
        'total_nodes': len(nodes),
        'total_edges': len(edges),
        'by_type': {},
        'by_group': {}
    }
}

for n in nodes.values():
    t = n['type']
    g = n['group']
    graph_data['stats']['by_type'][t] = graph_data['stats']['by_type'].get(t, 0) + 1
    graph_data['stats']['by_group'][g] = graph_data['stats']['by_group'].get(g, 0) + 1

with open(GRAPH_DIR / 'graph.json', 'w', encoding='utf-8') as f:
    json.dump(graph_data, f, ensure_ascii=False, indent=2)

print(f'Wrote graph/graph.json ({len(nodes)} nodes, {len(edges)} edges)')

# ── 4. Generate self-contained HTML ──────────────────────────────────────────

# Group colors
GROUP_COLORS = {
    'Accounting': '#3b82f6', 'HR': '#10b981', 'Sales': '#f59e0b',
    'Purchasing': '#8b5cf6', 'Inventory': '#06b6d4', 'Manufacturing': '#f97316',
    'Finance': '#6366f1', 'CRM': '#ec4899', 'ZATCA': '#ef4444',
    'Auth': '#dc2626', 'Mfa': '#b91c1c', 'Queue': '#7c3aed',
    'Event': '#4f46e5', 'Logger': '#64748b', 'Rate': '#f43f5e',
    'Vector': '#0ea5e9', 'Ai': '#a855f7', 'Pdf': '#e11d48',
    'Email': '#0891b2', 'Cloud': '#14b8a6', 'Prisma': '#2dd4bf',
    'Translation': '#84cc16', 'API': '#f97316', 'Lib': '#94a3b8',
    'Pages': '#cbd5e1', 'Config': '#fbbf24', 'Other': '#6b7280',
}

TYPE_SHAPES = {
    'api': 'diamond', 'page': 'dot', 'lib': 'square',
    'config': 'star', 'other': 'triangle',
}

# Build vis.js dataset entries
vis_nodes = []
for n in nodes.values():
    color = GROUP_COLORS.get(n['group'], '#6b7280')
    shape = TYPE_SHAPES.get(n['type'], 'dot')
    vis_nodes.append({
        'id': n['id'],
        'label': n['label'][:40],
        'title': f"<b>{html.escape(n['label'])}</b><br/><small>{html.escape(n['path'])}</small><br/>Group: {n['group']} | Type: {n['type']}",
        'color': {'background': color, 'border': color, 'highlight': {'background': '#fff', 'border': color}},
        'shape': shape,
        'size': 14 if n['type'] == 'lib' else 10,
        'font': {'color': '#f1f5f9', 'size': 10},
        'group': n['group'],
    })

vis_edges = [{'from': e['from'], 'to': e['to'], 'arrows': 'to', 'color': {'opacity': 0.25}, 'width': 0.5} for e in edges]

groups_json = {g: {'color': {'background': c, 'border': c}} for g, c in GROUP_COLORS.items()}

stats = graph_data['stats']
type_rows = ''.join(f'<tr><td>{t}</td><td>{c}</td></tr>' for t, c in sorted(stats['by_type'].items(), key=lambda x: -x[1]))
group_rows = "".join(
    "<tr><td><span class=dot style=background:" + GROUP_COLORS.get(g, "#6b7280") + "></span>" + g + "</td><td>" + str(cnt) + "</td></tr>"
    for g, cnt in sorted(stats["by_group"].items(), key=lambda x: -x[1])[:20])

HTML = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>NamaSoft ERP — Knowledge Graph</title>
<script src="https://unpkg.com/vis-network@9.1.9/dist/vis-network.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/vis-network@9.1.9/dist/dist/vis-network.min.css"/>
<style>
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  body {{ background:#0f172a; color:#f1f5f9; font-family:system-ui,sans-serif; display:flex; height:100vh; overflow:hidden; }}
  #sidebar {{ width:280px; min-width:240px; background:#1e293b; display:flex; flex-direction:column; border-left:1px solid #334155; z-index:10; overflow:hidden; }}
  #sidebar h1 {{ padding:16px; font-size:14px; font-weight:700; color:#38bdf8; border-bottom:1px solid #334155; }}
  #search {{ padding:10px; }}
  #search input {{ width:100%; padding:8px 10px; background:#0f172a; border:1px solid #334155; border-radius:6px; color:#f1f5f9; font-size:13px; }}
  #stats {{ padding:10px 16px; font-size:12px; color:#94a3b8; border-bottom:1px solid #1e293b; }}
  #stats strong {{ color:#f1f5f9; }}
  #legend {{ padding:10px 16px; font-size:12px; overflow-y:auto; flex:1; }}
  #legend h3 {{ margin-bottom:8px; color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; }}
  table {{ width:100%; border-collapse:collapse; font-size:12px; }}
  tr:hover {{ background:#0f172a; }}
  td {{ padding:3px 6px; color:#cbd5e1; }}
  td:last-child {{ text-align:left; color:#64748b; }}
  .dot {{ display:inline-block; width:8px; height:8px; border-radius:50%; margin-left:6px; }}
  #graph-container {{ flex:1; position:relative; }}
  #network {{ width:100%; height:100%; }}
  #controls {{ position:absolute; bottom:16px; left:16px; display:flex; gap:8px; }}
  .btn {{ padding:6px 12px; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#94a3b8; cursor:pointer; font-size:12px; transition:all 0.2s; }}
  .btn:hover {{ background:#334155; color:#f1f5f9; }}
  #info-panel {{ position:absolute; top:16px; left:16px; background:#1e293b; border:1px solid #334155; border-radius:8px; padding:14px; max-width:320px; font-size:12px; display:none; }}
  #info-panel h4 {{ color:#38bdf8; margin-bottom:6px; font-size:13px; }}
  #info-panel p {{ color:#94a3b8; line-height:1.5; }}
  #info-panel .badge {{ display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; margin-top:6px; background:#0f172a; color:#64748b; }}
</style>
</head>
<body>
<div id="sidebar">
  <h1>🗺️ NamaSoft ERP — Knowledge Graph</h1>
  <div id="search"><input type="text" id="search-input" placeholder="ابحث عن ملف أو وحدة..."/></div>
  <div id="stats">
    <strong>{len(nodes)}</strong> ملف &nbsp;|&nbsp; <strong>{len(edges)}</strong> علاقة import
  </div>
  <div id="legend">
    <h3>📂 حسب المجموعة</h3>
    <table>{group_rows}</table>
    <br/>
    <h3>🔷 حسب النوع</h3>
    <table>{type_rows}</table>
    <br/>
    <h3>📐 أشكال العقد</h3>
    <table>
      <tr><td>◆ API Route</td></tr>
      <tr><td>● Page</td></tr>
      <tr><td>■ Lib Module</td></tr>
      <tr><td>★ Config</td></tr>
    </table>
  </div>
</div>
<div id="graph-container">
  <div id="network"></div>
  <div id="info-panel">
    <h4 id="info-label"></h4>
    <p id="info-path"></p>
    <span class="badge" id="info-group"></span>
    <span class="badge" id="info-type"></span>
  </div>
  <div id="controls">
    <button class="btn" onclick="network.fit()">⊞ ضبط العرض</button>
    <button class="btn" onclick="togglePhysics()">⚡ Physics</button>
    <button class="btn" onclick="filterGroup()">🔍 تصفية</button>
  </div>
</div>

<script>
const rawNodes = {json.dumps(vis_nodes, ensure_ascii=False)};
const rawEdges = {json.dumps(vis_edges, ensure_ascii=False)};

const container = document.getElementById('network');
const data = {{
  nodes: new vis.DataSet(rawNodes),
  edges: new vis.DataSet(rawEdges)
}};

const options = {{
  physics: {{
    enabled: true,
    stabilization: {{ iterations: 100 }},
    barnesHut: {{ gravitationalConstant: -8000, springLength: 120, damping: 0.4 }}
  }},
  interaction: {{ hover: true, tooltipDelay: 100, navigationButtons: true, keyboard: true }},
  nodes: {{ borderWidth: 0, shadow: {{ enabled: true, size: 4 }} }},
  edges: {{ smooth: {{ type: 'continuous' }} }},
  groups: {json.dumps(groups_json, ensure_ascii=False)}
}};

const network = new vis.Network(container, data, options);
let physicsOn = true;

network.on('selectNode', (params) => {{
  if (!params.nodes.length) return;
  const nid = params.nodes[0];
  const n = rawNodes.find(x => x.id === nid);
  if (!n) return;
  document.getElementById('info-label').textContent = n.label;
  document.getElementById('info-path').textContent = n.title.replace(/<[^>]+>/g, ' ').trim();
  document.getElementById('info-group').textContent = '📂 ' + n.group;
  document.getElementById('info-type').textContent = '🔷 ' + (n.type || '');
  document.getElementById('info-panel').style.display = 'block';
}});

network.on('deselectNode', () => {{
  document.getElementById('info-panel').style.display = 'none';
}});

document.getElementById('search-input').addEventListener('input', function() {{
  const q = this.value.toLowerCase();
  if (!q) {{ data.nodes.update(rawNodes.map(n => ({{ id: n.id, hidden: false }}))); return; }}
  data.nodes.update(rawNodes.map(n => ({{
    id: n.id,
    hidden: !n.label.toLowerCase().includes(q) && !(n.title||'').toLowerCase().includes(q)
  }})));
}});

function togglePhysics() {{
  physicsOn = !physicsOn;
  network.setOptions({{ physics: {{ enabled: physicsOn }} }});
}}

function filterGroup() {{
  const g = prompt('اكتب اسم المجموعة للتصفية (Accounting, HR, Sales, ZATCA, ...):', '');
  if (!g) {{ data.nodes.update(rawNodes.map(n => ({{ id: n.id, hidden: false }}))); return; }}
  data.nodes.update(rawNodes.map(n => ({{ id: n.id, hidden: n.group.toLowerCase() !== g.toLowerCase() }})));
}}
</script>
</body>
</html>"""

html_path = GRAPH_DIR / 'index.html'
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(HTML)

print(f'Wrote graph/index.html ({len(HTML):,} bytes)')
print()
print('=== GRAPH SUMMARY ===')
for t, c in sorted(stats['by_type'].items(), key=lambda x: -x[1]):
    print(f'  {t:12s}: {c}')
print()
for g, c in sorted(stats['by_group'].items(), key=lambda x: -x[1])[:15]:
    print(f'  {g:16s}: {c}')
