"""Step 5: Label communities and regenerate report."""
import sys, json, multiprocessing
from graphify.build import build_from_json
from graphify.cluster import score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from pathlib import Path

def main():
    extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding='utf-8'))
    detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
    analysis   = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding='utf-8'))

    G = build_from_json(extraction)
    communities = {int(k): v for k, v in analysis['communities'].items()}
    cohesion = {int(k): v for k, v in analysis['cohesion'].items()}
    tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}

    labels = {
        0: "Advanced API Routes",
        1: "UI Page Components",
        2: "Operational Pages",
        3: "Business API Endpoints",
        4: "Core API Routes",
        5: "Page Event Handlers",
        6: "Audit & Banking Routes",
        7: "Accounting Engine Core",
        8: "Backup & System Routes",
        9: "Electron Protected Main",
        10: "Financial Operations API",
        11: "Budget & Capture API",
        12: "Journal & Adjustments API",
        13: "Electron Backup Sync",
        14: "Electron Main Process",
        15: "Electron Offline DB",
        16: "Financial Transaction Routes",
        17: "AI & Messaging Routes",
        18: "ZATCA & Sales Integration",
        19: "Sidebar Navigation",
        20: "Workflow Lifecycle API",
        21: "MFA & Auth Security",
        22: "Shared UI Components",
        23: "Auth & Login Routes",
        24: "AI CFO & Knowledge",
        25: "POS Sales Page",
        26: "Local PostgreSQL DB",
        27: "ZATCA Offline Module",
        28: "Python Utility Scripts",
        29: "Products & Inventory API",
    }
    
    # Fill remaining communities with generic labels
    for cid in communities:
        if cid not in labels:
            labels[cid] = f"Community {cid}"

    questions = suggest_questions(G, communities, labels)

    report = generate(G, communities, cohesion, labels, analysis['gods'], analysis['surprises'], detection, tokens, '.', suggested_questions=questions)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding='utf-8')
    Path('graphify-out/.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}), encoding='utf-8')
    print('Report updated with community labels')

if __name__ == '__main__':
    multiprocessing.freeze_support()
    main()
