"""Fresh graphify analysis: cross-module deps + hubs/bridges + architectural debt."""
import json
from pathlib import Path
from collections import defaultdict, Counter
import networkx as nx
from networkx.readwrite import json_graph

data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')
analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text())
communities = {int(k): v for k, v in analysis['communities'].items()}
comm_of = {}
for cid, members in communities.items():
    for n in members:
        comm_of[n] = cid


def module_of(src):
    if not src:
        return 'unknown'
    p = src.replace('\\', '/').lower()
    if '(dashboard)/' in p:
        seg = p.split('(dashboard)/')[1].split('/')[0]
        return 'ui::' + seg
    if 'src/app/api/' in p or '/api/' in p:
        seg = p.split('/api/')[1].split('/')[0]
        return 'api::' + seg
    if 'src/lib/' in p or '/lib/' in p:
        if '/rag/' in p or '/vector' in p:
            return 'lib::rag'
        if '/services/' in p:
            return 'lib::services'
        if 'auto-journal' in p:
            return 'lib::auto-journal'
        if '/api/' in p:
            return 'lib::api-core'
        if '/tenant' in p or '/auth' in p:
            return 'lib::security'
        return 'lib::other'
    if 'src/services/' in p:
        seg = p.split('src/services/')[1].split('/')[0]
        return 'svc::' + seg
    if 'electron' in p:
        return 'electron'
    if 'prisma/' in p:
        return 'prisma'
    if 'scripts/' in p:
        return 'scripts'
    if 'tests/' in p or '__tests__' in p or '.test.' in p or '.spec.' in p:
        return 'tests'
    if '.md' in p or 'docs/' in p:
        return 'docs'
    return 'other'


for nid in G.nodes:
    G.nodes[nid]['module'] = module_of(G.nodes[nid].get('source_file', ''))


# Cross-module edges
cross = defaultdict(int)
intra = defaultdict(int)
for u, v, d in G.edges(data=True):
    mu = G.nodes[u].get('module', 'unknown')
    mv = G.nodes[v].get('module', 'unknown')
    rel = d.get('relation', '')
    if mu != mv:
        cross[(mu, mv, rel)] += 1
    else:
        intra[mu] += 1

top_cross = sorted(cross.items(), key=lambda x: -x[1])[:50]
print('=== TOP CROSS-MODULE EDGES (src -> dst, relation, count) ===')
for (src, dst, rel), cnt in top_cross[:40]:
    print('  {:5d}  {:32s} --{:14s}--> {}'.format(cnt, src[:32], rel[:14], dst))

deg = dict(G.degree())
print('\n=== GRAPH SHAPE ===')
print('  nodes: {} | edges: {} | directed: {}'.format(G.number_of_nodes(), G.number_of_edges(), G.is_directed()))
print('  density: {:.6f} | avg degree: {:.2f}'.format(nx.density(G), sum(deg.values())/len(deg)))

# Bridge nodes (touch many communities)
node_comms = defaultdict(set)
for u, v in G.edges():
    cu, cv = comm_of.get(u, -1), comm_of.get(v, -1)
    if cu != cv:
        node_comms[u].add(cv)
        node_comms[v].add(cu)
bridges = sorted(node_comms.items(), key=lambda x: -len(x[1]))[:25]
print('\n=== TOP 25 BRIDGE NODES (communities touched) ===')
for nid, comms in bridges:
    nd = G.nodes[nid]
    print('  {:4d}  {:50s}  ({})'.format(len(comms), nd.get('label', '?')[:50], nd.get('source_file', '')[:60]))

# Hubs
hubs = sorted(deg.items(), key=lambda x: -x[1])[:25]
print('\n=== TOP 25 HUB NODES (degree) ===')
for nid, d in hubs:
    nd = G.nodes[nid]
    print('  {:5d}  {:40s}  ({})'.format(d, nd.get('label', '?')[:40], nd.get('source_file', '')[:60]))

# Architectural debt signals
print('\n=== ARCHITECTURAL DEBT SIGNALS ===')

# Debt 1: Duplicate roots
src_files = set(G.nodes[n].get('source_file', '') for n in G.nodes)
dup_pairs = []
for f in src_files:
    if f.startswith('src/lib/'):
        twin = f.replace('src/lib/', 'lib/', 1)
        if twin in src_files:
            dup_pairs.append((f, twin))
    if f.startswith('src/app/'):
        twin = f.replace('src/app/', 'app/', 1)
        if twin in src_files:
            dup_pairs.append((f, twin))
print('\n  DEBT-1: Duplicate src/* vs * file paths: {}'.format(len(dup_pairs)))
for a, b in dup_pairs[:8]:
    print('    {}   <==DUP==>   {}'.format(a, b))
if len(dup_pairs) > 8:
    print('    ... and {} more'.format(len(dup_pairs)-8))

# Debt 2: ComingSoonModule usage
csm_files = set()
for nid in G.nodes:
    if 'ComingSoonModule' in G.nodes[nid].get('label', ''):
        csm_files.add(G.nodes[nid].get('source_file', ''))
print('\n  DEBT-2: ComingSoonModule placeholder source files: {}'.format(len(csm_files)))

# Debt 3: SPOFs
spofs = [(n, d) for n, d in deg.items() if d > 500]
spofs.sort(key=lambda x: -x[1])
print('\n  DEBT-3: SPOF candidates (degree > 500): {}'.format(len(spofs)))
for n, d in spofs[:10]:
    nd = G.nodes[n]
    print('    {:5d}  {:40s}  ({})'.format(d, nd.get('label', '?')[:40], nd.get('source_file', '')[:60]))

# Debt 4: isolated modules
mod_in = defaultdict(int)
mod_out = defaultdict(int)
for u, v in G.edges():
    mu = G.nodes[u].get('module', 'unknown')
    mv = G.nodes[v].get('module', 'unknown')
    if mu != mv:
        mod_out[mu] += 1
        mod_in[mv] += 1
all_mods = set(mod_in) | set(mod_out)
node_counts = Counter(G.nodes[n].get('module', 'unknown') for n in G.nodes)
isolated = [m for m in all_mods if mod_in.get(m, 0) + mod_out.get(m, 0) < 5 and node_counts[m] > 20]
print('\n  DEBT-4: Near-isolated modules (<=4 cross edges, >=20 nodes): {}'.format(len(isolated)))
for m in sorted(isolated, key=lambda x: -node_counts[x])[:15]:
    print('    {:5d} nodes  {}  (in={} out={})'.format(node_counts[m], m, mod_in.get(m, 0), mod_out.get(m, 0)))

# Debt 5: API without service layer
api_modules = [m for m in all_mods if m.startswith('api::')]
svc_modules = [m for m in all_mods if m.startswith('svc::')]
print('\n  DEBT-5: API modules ({}) vs Service modules ({})'.format(len(api_modules), len(svc_modules)))

api_calling_svc = set()
for u, v in G.edges():
    mu = G.nodes[u].get('module', 'unknown')
    mv = G.nodes[v].get('module', 'unknown')
    if mu.startswith('api::') and (mv.startswith('svc::') or mv == 'lib::services'):
        api_calling_svc.add(mu)
api_no_svc = sorted(set(api_modules) - api_calling_svc)
print('  -> API modules NOT calling any service layer: {} / {}'.format(len(api_no_svc), len(api_modules)))
for m in api_no_svc[:20]:
    print('    - ' + m)

# Save
Path('graphify-out/.fresh_analysis.json').write_text(json.dumps({
    'shape': {'nodes': G.number_of_nodes(), 'edges': G.number_of_edges(),
              'communities': len(set(comm_of.values())), 'density': nx.density(G),
              'avg_degree': sum(deg.values())/len(deg)},
    'top_cross_module_edges': [{'src': s, 'dst': d, 'rel': r, 'count': c} for (s, d, r), c in top_cross],
    'bridges_top25': [{'label': G.nodes[n].get('label', ''), 'file': G.nodes[n].get('source_file', ''),
                       'comms_touched': len(c)} for n, c in bridges],
    'hubs_top25': [{'label': G.nodes[n].get('label', ''), 'file': G.nodes[n].get('source_file', ''),
                    'degree': d} for n, d in hubs],
    'debt_duplicate_roots': len(dup_pairs),
    'debt_duplicate_roots_sample': [{'a': a, 'b': b} for a, b in dup_pairs[:20]],
    'debt_coming_soon_files': len(csm_files),
    'debt_spofs': [{'label': G.nodes[n].get('label', ''), 'file': G.nodes[n].get('source_file', ''),
                    'degree': d} for n, d in spofs[:15]],
    'debt_isolated_modules': [{'mod': m, 'nodes': node_counts[m], 'cross_in': mod_in.get(m, 0),
                              'cross_out': mod_out.get(m, 0)} for m in sorted(isolated, key=lambda x: -node_counts[x])[:25]],
    'debt_api_no_service_layer': api_no_svc,
    'module_node_counts_top40': dict(node_counts.most_common(40)),
}, indent=2, default=str))
print('\nfresh_analysis.json saved.')
