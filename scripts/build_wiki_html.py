"""Build a single-file HTML viewer for the graphify wiki.
Reads graphify-out/wiki/*.md and emits graphify-out/wiki.html.
No pip dependency; uses marked.js from CDN for rendering.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

WIKI_DIR = Path("graphify-out/wiki")
OUT = Path("graphify-out/wiki.html")


def slug(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", s)


def main() -> None:
    if not WIKI_DIR.is_dir():
        raise SystemExit(f"missing {WIKI_DIR}")

    files = sorted(WIKI_DIR.glob("*.md"))
    if not files:
        raise SystemExit("no .md files in wiki dir")

    # Build pages dict: title -> raw markdown
    pages: dict[str, str] = {}
    index_md = ""
    for f in files:
        title = f.stem
        text = f.read_text(encoding="utf-8")
        if title == "index":
            index_md = text
        pages[title] = text

    # Order pages by community size (parse "N nodes" from each)
    def page_size(title: str) -> int:
        m = re.search(r"(\d+)\s+nodes", pages[title].splitlines()[2] if len(pages[title].splitlines()) > 2 else "")
        return int(m.group(1)) if m else 0

    # Sort: index first, then by size desc
    sorted_titles = sorted(
        [t for t in pages if t != "index"],
        key=lambda t: -page_size(t),
    )
    if "index" in pages:
        sorted_titles = ["index"] + sorted_titles

    pages_json = json.dumps(pages, ensure_ascii=False)
    titles_json = json.dumps(sorted_titles, ensure_ascii=False)

    html = """<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Namasoft ERP — graphify wiki (src/lib)</title>
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: #1f2328; background: #fff; }
#layout { display: flex; height: 100vh; }
#sidebar { width: 320px; min-width: 280px; max-width: 420px; resize: horizontal; overflow: auto; border-right: 1px solid #d1d9e0; background: #f6f8fa; padding: 16px; }
#sidebar h2 { font-size: 14px; margin: 8px 0; color: #59636e; text-transform: uppercase; letter-spacing: 0.5px; }
#search { width: 100%; padding: 8px 10px; border: 1px solid #d1d9e0; border-radius: 6px; font-size: 13px; margin-bottom: 12px; }
#nav { list-style: none; padding: 0; margin: 0; font-size: 13px; }
#nav li { padding: 4px 8px; cursor: pointer; border-radius: 4px; margin-bottom: 1px; line-height: 1.35; }
#nav li:hover { background: #e7ecf0; }
#nav li.active { background: #0969da; color: #fff; }
#nav li.active .size { color: #cfd9e0; }
#nav li .size { color: #59636e; font-size: 11px; margin-left: 6px; }
#main { flex: 1; overflow: auto; padding: 32px 48px; max-width: 100%; }
#main h1 { border-bottom: 1px solid #d1d9e0; padding-bottom: 8px; margin-top: 0; }
#main h2 { border-bottom: 1px solid #eaeef2; padding-bottom: 6px; margin-top: 28px; }
#main h3 { margin-top: 24px; }
#main code { background: #eaeef2; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }
#main pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }
#main pre code { background: none; padding: 0; }
#main blockquote { border-left: 4px solid #d1d9e0; padding: 0 16px; color: #59636e; margin: 12px 0; }
#main ul, #main ol { line-height: 1.7; }
#main a { color: #0969da; text-decoration: none; }
#main a:hover { text-decoration: underline; }
#main table { border-collapse: collapse; margin: 12px 0; }
#main th, #main td { border: 1px solid #d1d9e0; padding: 6px 12px; }
#main th { background: #f6f8fa; }
.wiki-link { color: #0969da; cursor: pointer; }
.wiki-link:hover { text-decoration: underline; }
#header-bar { padding: 8px 16px; background: #24292f; color: #fff; font-size: 13px; display: flex; align-items: center; gap: 16px; }
#header-bar strong { color: #fff; }
#header-bar .meta { color: #8b949e; font-size: 12px; }
.kbd { background: #2f363d; border: 1px solid #444c56; border-radius: 3px; padding: 2px 6px; font-family: ui-monospace, monospace; font-size: 11px; }
@media (max-width: 768px) {
  #sidebar { width: 100%; max-width: none; height: auto; max-height: 40vh; resize: none; }
  #layout { flex-direction: column; }
  #main { padding: 20px; }
}
</style>
</head>
<body>
<div id="header-bar">
  <strong>Namasoft ERP</strong>
  <span class="meta">graphify wiki · src/lib · 1530 nodes · 2043 edges · 227 communities</span>
  <span style="margin-left:auto" class="meta">press <span class="kbd">/</span> to search</span>
</div>
<div id="layout">
  <aside id="sidebar">
    <input id="search" placeholder="Filter communities..." autocomplete="off">
    <h2>Communities</h2>
    <ul id="nav"></ul>
  </aside>
  <main id="main">Loading…</main>
</div>
<script>
const PAGES = __PAGES__;
const TITLES = __TITLES__;

function pageSize(md){ const m = (md.split('\\n')[2]||'').match(/(\\d+)\\s+nodes/); return m ? parseInt(m[1]) : 0; }
function displayName(t){ return t === 'index' ? 'Index' : t.replaceAll('_',' '); }

function renderNav(filter=''){
  const ul = document.getElementById('nav');
  ul.innerHTML = '';
  const f = filter.toLowerCase();
  for (const t of TITLES){
    const name = displayName(t);
    if (f && !name.toLowerCase().includes(f)) continue;
    const li = document.createElement('li');
    li.dataset.title = t;
    const size = pageSize(PAGES[t] || '');
    li.innerHTML = `${escapeHtml(name)}${size ? `<span class="size">${size}</span>` : ''}`;
    li.onclick = () => showPage(t);
    ul.appendChild(li);
  }
}

function escapeHtml(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function processWikilinks(md){
  // [[Title]] -> markdown link to anchor
  return md.replace(/\\[\\[([^\\]]+)\\]\\]/g, (_, target) => {
    const t = target.trim();
    const slug = t.replaceAll(' ', '_');
    return `<a href="#${encodeURIComponent(slug)}" class="wiki-link" data-target="${escapeHtml(slug)}">${escapeHtml(t)}</a>`;
  });
}

function showPage(title){
  const raw = PAGES[title];
  if (!raw){ document.getElementById('main').innerHTML = `<h1>Not found</h1><p>${escapeHtml(title)}</p>`; return; }
  const processed = processWikilinks(raw);
  document.getElementById('main').innerHTML = marked.parse(processed);
  // hook up wiki links
  document.querySelectorAll('a.wiki-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = a.dataset.target;
      // try exact, fall back to underscore version
      if (PAGES[target]) showPage(target);
      else {
        // try variants
        const found = TITLES.find(t => t.toLowerCase() === target.toLowerCase());
        if (found) showPage(found);
      }
    });
  });
  // mark active
  document.querySelectorAll('#nav li').forEach(li => li.classList.toggle('active', li.dataset.title === title));
  // update hash
  history.replaceState(null, '', '#' + encodeURIComponent(title));
  document.getElementById('main').scrollTop = 0;
}

document.getElementById('search').addEventListener('input', e => renderNav(e.target.value));

document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT'){
    e.preventDefault();
    document.getElementById('search').focus();
  }
});

renderNav();
const hash = decodeURIComponent(location.hash.slice(1));
showPage(hash && PAGES[hash] ? hash : (TITLES.includes('index') ? 'index' : TITLES[0]));
</script>
</body>
</html>
"""
    html = html.replace("__PAGES__", pages_json).replace("__TITLES__", titles_json)
    OUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes, {len(pages)} pages)")


if __name__ == "__main__":
    main()
