#!/usr/bin/env python3
"""Build js/streets-data.js from City of Berkeley open data.

Usage: python3 tools/build-streets.py Street_Centerlines.geojson [Business_Licenses.csv]

Businesses are geocoded by interpolating their street number along the centerline
address ranges (FRADDL/TOADDL on the left side, FRADDR/TOADDR on the right).

Crops to the play area (Hopkins down to Dwight, Sacramento over to Shattuck),
projects lon/lat to game pixels, simplifies the polylines, snaps shared endpoints
into intersection nodes, and exports a few named reference points.
"""
import csv
import json
import math
import re
import sys
from collections import defaultdict

# Play area: lon west/east, lat south/north
LON0, LON1 = -122.2875, -122.2650
LAT0, LAT1 = 37.8625, 37.8880
PAD = 0.0012          # keep segments slightly outside the crop so roads don't stop at the edge
SCALE = 2.6           # game pixels per metre (roads are drawn wider than real life)
M_PER_DEG_LAT = 110990.0
M_PER_DEG_LON = 111320.0 * math.cos(math.radians((LAT0 + LAT1) / 2))

ARTERIAL = {'SACRAMENTO ST', 'SHATTUCK AV', 'KALA BAGAI WY', 'UNIVERSITY AV', 'MARTIN LUTHER KING JR WY', 'ASHBY AV'}
COLLECTOR = {'HOPKINS ST', 'CEDAR ST', 'ROSE ST', 'MILVIA ST', 'ALLSTON WY', 'CENTER ST', 'DWIGHT WY', 'CHANNING WY',
             'HEARST AV', 'VIRGINIA ST', 'MONTEREY AV', 'THE ALAMEDA', 'ADDISON ST', 'BANCROFT WY', 'DELAWARE ST'}
SKIP_TYPES = {'PA', 'WK'}

SUFFIX = {'WY': 'WAY', 'AV': 'AVE', 'ST': 'ST', 'DR': 'DR', 'PL': 'PL', 'CT': 'CT', 'CI': 'CIR', 'RD': 'RD'}


def project(lon, lat):
    return ((lon - LON0) * M_PER_DEG_LON * SCALE, (LAT1 - lat) * M_PER_DEG_LAT * SCALE)


def pretty(name):
    if not name:
        return ''
    parts = name.split(' ')
    if parts[-1] in SUFFIX:
        parts[-1] = SUFFIX[parts[-1]]
    return ' '.join(parts)


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    L = math.hypot(dx, dy) or 1e-9
    best, idx = -1, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + bx * ay - by * ax) / L
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


STOREFRONT_NAICS = ('44', '45', '722', '8121', '7139', '7111', '5121', '8123', '6214')
ADDR_SUFFIX = {'AVE': 'AV', 'AVENUE': 'AV', 'WAY': 'WY', 'STREET': 'ST', 'BLVD': 'BL', 'COURT': 'CT', 'PLACE': 'PL'}
NAME_FIXES = {'M L KING JR WY': 'MARTIN LUTHER KING JR WY', 'MARTIN LUTHER KING WY': 'MARTIN LUTHER KING JR WY', 'ALAMEDA': 'THE ALAMEDA'}


def norm_street(st):
    parts = st.upper().replace('.', '').split()
    if parts and parts[-1] in ADDR_SUFFIX:
        parts[-1] = ADDR_SUFFIX[parts[-1]]
    name = ' '.join(parts)
    return NAME_FIXES.get(name, name)


def clean_name(n):
    n = re.sub(r'\s+#\s*\d+.*$', '', n.strip())
    n = re.sub(r',?\s+(LLC|INC|INC\.|CORP|CORPORATION|CO|LP|LTD)\.?$', '', n, flags=re.I)
    return n.strip().upper()[:22]


def rank(naics):
    if naics.startswith(('445', '722')):
        return 0
    if naics.startswith(('44', '45')):
        return 1
    return 2


def geocode_businesses(csv_path, features):
    by_street = {}
    for f in features:
        by_street.setdefault(f['properties'].get('STREET'), []).append(f)
    best = {}
    for row in csv.DictReader(open(csv_path, encoding='utf-8', errors='replace')):
        naics = (row.get('NAICS') or '').strip()
        if not naics.startswith(STOREFRONT_NAICS):
            continue
        m = re.match(r'^(\d+)\s+(.+)$', (row.get('B1_FULL_ADDRESS') or '').strip())
        if not m:
            continue
        num, street = int(m.group(1)), norm_street(m.group(2))
        name = clean_name(row.get('DBA') or row.get('B1_BUSINESS_NAME') or '')
        if not name:
            continue
        key = (num, street)
        if key not in best or rank(naics) < best[key][0]:
            best[key] = (rank(naics), name, naics)
    out = []
    for (num, street), (rk, name, naics) in best.items():
        for f in by_street.get(street, []):
            p = f['properties']
            hit = None
            for side, fr, to in ((1, p.get('FRADDL'), p.get('TOADDL')), (-1, p.get('FRADDR'), p.get('TOADDR'))):
                try:
                    fr, to = int(fr), int(to)
                except (TypeError, ValueError):
                    continue
                if min(fr, to) <= num <= max(fr, to) and fr % 2 == num % 2:
                    hit = (side, 0.5 if fr == to else (num - fr) / (to - fr))
                    break
            if not hit:
                continue
            lon_lat = f['geometry']['coordinates']
            if not any(LON0 <= x <= LON1 and LAT0 <= y <= LAT1 for x, y in lon_lat):
                break
            pts = [project(x, y) for x, y in lon_lat]
            seg = [math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1)]
            target = sum(seg) * hit[1]
            for i, L in enumerate(seg):
                if target <= L or i == len(seg) - 1:
                    t = target / L if L else 0
                    x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t
                    y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t
                    dx, dy = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]
                    d = math.hypot(dx, dy) or 1
                    # left of travel in y-down coords is (dy, -dx)
                    nx, ny = (dy / d, -dx / d) if hit[0] == 1 else (-dy / d, dx / d)
                    cat = 'food' if naics.startswith(('445', '722')) else 'shop' if naics.startswith(('44', '45')) else 'svc'
                    out.append([name, round(x), round(y), round(nx, 3), round(ny, 3), cat])
                    break
                target -= L
            break
    return out


def main(src, dst, biz_csv=None):
    data = json.load(open(src))
    roads = []
    for f in data['features']:
        p = f['properties']
        if p.get('TRVLWAY') == 'NT' or p.get('SFEATYP') in SKIP_TYPES:
            continue
        if p.get('CLASS') in ('Interstate', 'Ramp'):
            continue
        coords = f['geometry']['coordinates']
        if not any(LON0 - PAD <= x <= LON1 + PAD and LAT0 - PAD <= y <= LAT1 + PAD for x, y in coords):
            continue
        name = p.get('STREET') or ''
        cls = 'A' if name in ARTERIAL else 'C' if name in COLLECTOR else 'L'
        pts = simplify([project(x, y) for x, y in coords], 1.2)
        roads.append({'raw': name, 'name': pretty(name), 'cls': cls, 'pts': pts})

    # snap endpoints that are within 3 px of each other into shared nodes
    nodes = []
    def node_for(pt):
        for i, (x, y) in enumerate(nodes):
            if abs(x - pt[0]) < 3 and abs(y - pt[1]) < 3:
                return i
        nodes.append(pt)
        return len(nodes) - 1
    for r in roads:
        r['a'] = node_for(r['pts'][0])
        r['b'] = node_for(r['pts'][-1])
        r['pts'][0] = nodes[r['a']]
        r['pts'][-1] = nodes[r['b']]

    names = sorted({r['name'] for r in roads})
    name_idx = {n: i for i, n in enumerate(names)}

    def inter(n1, n2):
        by_node = defaultdict(set)
        for r in roads:
            by_node[r['a']].add(r['raw'])
            by_node[r['b']].add(r['raw'])
        for i, s in by_node.items():
            if n1 in s and n2 in s:
                return [round(nodes[i][0]), round(nodes[i][1])]
        raise SystemExit(f'no intersection {n1} / {n2}')

    def pt(lon, lat):
        x, y = project(lon, lat)
        return [round(x), round(y)]

    refs = {
        'spawn': inter('SHATTUCK AV', 'DWIGHT WY'),
        'hopkinsMonterey': inter('HOPKINS ST', 'MONTEREY AV'),
        'hopkinsSacramento': inter('HOPKINS ST', 'SACRAMENTO ST'),
        'hopkinsMcgee': inter('HOPKINS ST', 'MCGEE AV'),
        'mlkAllston': inter('MARTIN LUTHER KING JR WY', 'ALLSTON WY'),
        'mlkCenter': inter('MARTIN LUTHER KING JR WY', 'CENTER ST'),
        'milvaAllston': inter('MILVIA ST', 'ALLSTON WY'),
        'milviaCenter': inter('MILVIA ST', 'CENTER ST'),
        'mlkUniversity': inter('MARTIN LUTHER KING JR WY', 'UNIVERSITY AV'),
        'mlkChanning': inter('MARTIN LUTHER KING JR WY', 'CHANNING WY'),
        'milviaChanning': inter('MILVIA ST', 'CHANNING WY'),
        'mckinleyAllston': inter('MCKINLEY AV', 'ALLSTON WY'),
        # set-piece spots (lon/lat chosen on the likely routes)
        'historicPothole': pt(-122.27318, 37.87420),
        'pinball': pt(-122.27345, 37.87720),
        'repairPothole': pt(-122.27050, 37.86900),
        'closeShattuck': pt(-122.26800, 37.86930),
        'closeKalaBagai': pt(-122.26835, 37.86930),
        'closeMilvia': pt(-122.27030, 37.87330),
        'closeSacramento': pt(-122.28050, 37.87300),
    }

    # Real cross streets south along MLK from Allston, with which side(s) they leave on.
    # Heading south, west is on the driver's right.
    feats = data['features']
    mlk_nodes = {}
    for f in feats:
        p = f['properties']
        if p.get('STREET') != 'MARTIN LUTHER KING JR WY':
            continue
        for c in (f['geometry']['coordinates'][0], f['geometry']['coordinates'][-1]):
            mlk_nodes[(round(c[0], 5), round(c[1], 5))] = set()
    for f in feats:
        p = f['properties']
        name = p.get('STREET')
        if not name or name == 'MARTIN LUTHER KING JR WY':
            continue
        c = f['geometry']['coordinates']
        for end, other in ((c[0], c[-1]), (c[-1], c[0])):
            k = (round(end[0], 5), round(end[1], 5))
            if k in mlk_nodes:
                mlk_nodes[k].add((name, 'W' if other[0] < end[0] else 'E'))
    allston_lat = 37.86877
    cross = []
    for (lon, lat), v in sorted(mlk_nodes.items(), key=lambda kv: -kv[0][1]):
        if lat >= allston_lat - 1e-5 or not v:
            continue
        cross_names = sorted({n for n, _ in v})
        sides = ''.join(sorted({sd for _, sd in v}))
        cross.append([pretty(cross_names[0]), sides])
    slalom_cross = cross[:16]

    out = {
        'scale': SCALE,
        'w': round((LON1 - LON0) * M_PER_DEG_LON * SCALE),
        'h': round((LAT1 - LAT0) * M_PER_DEG_LAT * SCALE),
        'names': names,
        'nodes': [[round(x), round(y)] for x, y in nodes],
        'roads': [[name_idx[r['name']], r['cls'], r['a'], r['b'], [v for p in r['pts'] for v in (round(p[0]), round(p[1]))]] for r in roads],
        'refs': refs,
        'slalomCross': slalom_cross,
        'businesses': geocode_businesses(biz_csv, data['features']) if biz_csv else [],
    }
    with open(dst, 'w') as fh:
        fh.write('// Generated by tools/build-streets.py from City of Berkeley street centerlines. Do not edit by hand.\n')
        fh.write('window.G = window.G || {};\nG.STREETS = ')
        json.dump(out, fh, separators=(',', ':'))
        fh.write(';\n')
    print(f'{len(roads)} roads, {len(nodes)} nodes, {len(out["businesses"])} businesses, {out["w"]}x{out["h"]} px -> {dst}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1], 'js/streets-data.js', sys.argv[2] if len(sys.argv) > 2 else None)
