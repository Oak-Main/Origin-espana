#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node build.mjs
if command -v python3 >/dev/null 2>&1; then PYTHON=python3; else PYTHON=python; fi
"$PYTHON" - <<'PY'
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

out = Path('dist')
root = ET.parse(out / 'sitemap.xml').getroot()
assert root.tag == '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset', root.tag
locs = []
for entry in root:
    values = {child.tag.rsplit('}', 1)[-1]: (child.text or '').strip() for child in entry}
    assert entry.tag.endswith('url'), entry.tag
    assert values.get('loc'), 'missing <loc>'
    assert values.get('lastmod'), f"missing <lastmod>: {values.get('loc')}"
    locs.append(values['loc'])
assert len(locs) == len(set(locs)), 'duplicate URLs in sitemap'

pages = {}
for html_path in out.rglob('index.html'):
    route = '/' if html_path.parent == out else '/' + html_path.parent.relative_to(out).as_posix().strip('/') + '/'
    html = html_path.read_text(encoding='utf-8')
    assert 'name="robots" content="noindex' not in html, route
    pages[route] = html

seen_routes = []
for loc in locs:
    parsed = urlsplit(loc)
    assert parsed.scheme == 'https' and parsed.netloc == 'originespana.com', loc
    assert not parsed.query and not parsed.fragment, loc
    route = unquote(parsed.path)
    assert route in pages, f'URL has no generated route: {loc}'
    assert f'<link rel="canonical" href="{loc}">' in pages[route], f'canonical/route mismatch: {loc}'
    seen_routes.append(route)
assert len(seen_routes) == len(set(seen_routes)), 'duplicate route after normalization'
assert set(seen_routes) == set(pages), f'route mismatch: missing={sorted(set(pages)-set(seen_routes))}'
assert len(locs) == len(pages), 'sitemap count does not match real page count'
print(f'PASS: {len(locs)} unique URLs; all {len(pages)} generated pages matched by route and canonical; XML and lastmod valid; no production requests')
PY
