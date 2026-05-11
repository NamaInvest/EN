"""Generate HTML viz for top N communities only — keeps graph readable."""
import json
from pathlib import Path
from collections import Counter
import networkx as nx
from networkx.readwrite import json_graph
from graphify.export import to_html

data = json.loads(Path('graphify-out/graph.json').read_text(encoding='utf-8'))
G_full = json_graph.node_link_graph(data, edges='links')

# Manual labels (top 60 communities)
LABELS = {
    0:  "API Routes: Accounting/Open-Items",
    1:  "Auth & Mixed API Routes",
    2:  "Dashboard Pages & Forms",
    3:  "API Routes: HR/Org/Budgets",
    4:  "API Routes: Enterprise/CRM/Contracts",
    5:  "Misc Dashboard Pages (AI/GRC)",
    6:  "Clinic & Admin Security Pages",
    7:  "API Handler Middleware (withRoute)",
    8:  "Recon/Webhook/ZATCA Routes",
    9:  "Knowledge/AP/Treasury API Routes",
    10: "Product Forms & Approval Rules",
    11: "Settings, Translations, COPA",
    12: "Document Pages: Assets/Sales",
    13: "Payment Runs & Approval Engine",
    14: "Financial Validation Schemas",
    15: "Service Layer: Sales/Accounting/FA",
    16: "POS Receipt & Printing (qz.io)",
    17: "shadcn/ui Primitives",
    18: "ZATCA E-Invoicing & Money Utils",
    19: "Procurement/Auto-Decompose/Budget",
    20: "Cache & Test Fixtures",
    21: "Event Bus, Queue, Webhooks",
    22: "Auto-Journal Engine",
    23: "Mudad Integration & Root Layout",
    24: "Prometheus Metrics",
    25: "Services: Assets/Inventory/WIP",
    26: "Telegram Bot Integration",
    27: "Bank Statements & Cash Application",
    28: "CRM Tickets, Workflow Builder",
    29: "Open Items / Aging Engine",
    30: "RMA State Machine",
    31: "Document State Machine (Mfg)",
    32: "AI Evaluation & MCP Bridge",
    33: "AP Payment Run & 3-Way Match",
    34: "Misc Form Pages (Audit/Pricing)",
    35: "Zod Validations Library",
    36: "Consolidation Engine",
    37: "Qiwa & Saudization Engine",
    38: "HR Performance & Reorder Service",
    39: "Manufacturing Pages & Fraud AI",
    40: "Hedge Accounting Engine",
    41: "Bookings + Decimal Utils",
    42: "API Handler & Expenses",
    43: "Leave Accrual Engine",
    44: "PDPL Compliance Engine",
    45: "Allocations & COPA Engine",
    46: "Chart of Accounts Hierarchy",
    47: "Library Services Misc",
    48: "GOSI Integration",
    49: "API Request Validation (Zod)",
    50: "Period Close Engine",
    51: "Financial Statements Engine",
    52: "Document Expiry Alerts",
    53: "AI Persona Prompts",
    54: "State Machine Tests",
    55: "Bank Recon Exceptions",
    56: "Year-End Close",
    57: "Cash Flow Forecasting",
    58: "Lot/Batch Inventory Engine",
    59: "RAG Pipeline & Citations",
}

KEEP_COMMUNITIES = set(LABELS.keys())

# Filter nodes: keep only members of top communities
keep_nodes = [nid for nid, d in G_full.nodes(data=True) if d.get('community') in KEEP_COMMUNITIES]
G = G_full.subgraph(keep_nodes).copy()
print(f'Filtered: {G.number_of_nodes()} nodes / {G.number_of_edges()} edges (from {G_full.number_of_nodes()} / {G_full.number_of_edges()})')

# Build community dict
communities = {}
for nid, d in G.nodes(data=True):
    cid = d.get('community')
    communities.setdefault(cid, []).append(nid)

# Optional: drop god-noise nodes that connect everything (logger spam)
# Keep them — they're informative. But drop pure singleton labels that are common dups (the AST extractor created duplicate 'log' / 'route.ts' / 'page.tsx' nodes).
# Skip that for now, the HTML viz handles it fine.

# Generate HTML — bypass the 5000 limit by chunking? No: 4218 should be under.
to_html(G, communities, 'graphify-out/graph.html', community_labels=LABELS)
print('graph.html written:', G.number_of_nodes(), 'nodes')
