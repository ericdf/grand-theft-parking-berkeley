#!/usr/bin/env python3
"""Build ferry/js/marina-geo.js: the Berkeley Marina's real shapes, for the cartoon.

Usage: python3 ferry/tools/build-marina.py berkeley-marina.osm Street_Centerlines.geojson

  berkeley-marina.osm   an OpenStreetMap extract of the Marina, e.g.
                        https://api.openstreetmap.org/api/0.6/map?bbox=-122.332,37.856,-122.296,37.880
                        (coastline, docks, breakwaters, piers, parks, parking lots, buildings)
  Street_Centerlines    City of Berkeley street centerlines (roads, I-80 and its ramps)

Output is in metres from an origin in the harbor, x east and y north. The film's
renderer (js/marina.js) projects it into a bird's-eye view from over the Bay.
OpenStreetMap data is (c) OpenStreetMap contributors, ODbL.
"""
import json
import math
import sys
import xml.etree.ElementTree as ET

LON_O, LAT_O = -122.3170, 37.8660          # origin: the harbor
LON0, LON1, LAT0, LAT1 = -122.332, -122.296, 37.856, 37.880
KX = 111320.0 * math.cos(math.radians(LAT_O))
KY = 110990.0
EAST_EDGE = -122.270                        # where the land polygon closes, well inland


def m(lon, lat):
    return ((lon - LON_O) * KX, (lat - LAT_O) * KY)


def inside(lon, lat, pad=0.0):
    return LON0 - pad < lon < LON1 + pad and LAT0 - pad < lat < LAT1 + pad


def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    (ax, ay), (bx, by) = pts[0], pts[-1]
    dx, dy = bx - ax, by - ay
    L = math.hypot(dx, dy)
    best, idx = -1, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * (px - ax) - dx * (py - ay)) / L if L > 1e-9 else math.hypot(px - ax, py - ay)
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


def rnd(pts):
    return [[round(x, 1), round(y, 1)] for x, y in pts]


def area(pts):
    return 0.5 * sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))


def centroid(pts):
    return [round(sum(p[0] for p in pts) / len(pts), 1), round(sum(p[1] for p in pts) / len(pts), 1)]


def main(osm_path, streets_path):
    root = ET.parse(osm_path).getroot()
    nodes = {n.get('id'): (float(n.get('lon')), float(n.get('lat'))) for n in root.iter('node')}
    ways = []
    for w in root.iter('way'):
        tags = {t.get('k'): t.get('v') for t in w.iter('tag')}
        refs = [nd.get('ref') for nd in w.findall('nd')]
        ll = [nodes[r] for r in refs if r in nodes]
        if len(ll) >= 2:
            ways.append((w.get('id'), tags, ll, refs[0] == refs[-1]))

    out = {'origin': [LON_O, LAT_O], 'credit': 'Map data: City of Berkeley; (c) OpenStreetMap contributors (ODbL)'}

    # --- land: chain the coastline (land on its left) and close it far inland ---
    coast = {wid: (refs, ll) for wid, tags, ll, closed in ways if tags.get('natural') == 'coastline'
             for refs in [[nd.get('ref') for nd in root.find(f"way[@id='{wid}']").findall('nd')]]}
    by_start = {refs[0]: (refs, ll) for refs, ll in coast.values()}
    ends = {refs[-1] for refs, _ in coast.values()}
    head = next(refs for refs, _ in coast.values() if refs[0] not in ends)
    chain, cur = [], by_start[head[0]]
    while cur:
        refs, ll = cur
        chain += ll if not chain else ll[1:]
        cur = by_start.get(refs[-1])
        if cur and cur[0] == head:
            break
    start, end = chain[0], chain[-1]
    ring = chain + [(EAST_EDGE, end[1]), (EAST_EDGE, start[1])]
    land = simplify([m(*p) for p in ring], 1.2)
    out['land'] = rnd(land)

    # --- water bodies inside the land (lagoons, ponds) ---
    out['ponds'] = []
    for wid, tags, ll, closed in ways:
        if tags.get('natural') == 'water' and closed and any(inside(*p) for p in ll):
            pts = simplify([m(*p) for p in ll], 1.5)
            if abs(area(pts)) > 800:
                out['ponds'].append(rnd(pts))

    def polys(pred, tol=1.0, min_area=0, named=True):
        res = []
        for wid, tags, ll, closed in ways:
            if not closed or not pred(tags) or not any(inside(*p) for p in ll):
                continue
            pts = simplify([m(*p) for p in ll], tol)
            if len(pts) < 3 or abs(area(pts)) < min_area:
                continue
            item = {'p': rnd(pts)}
            if named and tags.get('name'):
                item['name'] = tags['name']
            res.append(item)
        return res

    out['parks'] = polys(lambda t: t.get('leisure') in ('park', 'dog_park', 'nature_reserve') or t.get('landuse') in ('grass', 'meadow'), 1.5, 500)
    out['lots'] = polys(lambda t: t.get('amenity') == 'parking', 1.0, 200)

    # --- buildings: real footprints in the Marina, west of the freeway ---
    def west_of_freeway(lon, lat):
        return lon < -122.3060 if lat > 37.8640 else lon < -122.3020

    out['buildings'] = []
    for wid, tags, ll, closed in ways:
        if 'building' not in tags or not closed or not all(west_of_freeway(*p) and inside(*p) for p in ll):
            continue
        pts = simplify([m(*p) for p in ll], 0.8)
        if len(pts) >= 3 and abs(area(pts)) > 30:
            b = {'p': rnd(pts)}
            if tags.get('name'):
                b['name'] = tags['name']
            out['buildings'].append(b)

    # --- docks, breakwaters, the old pier ---
    out['docks'] = []
    out['breakwaters'] = []
    out['piers'] = []
    for wid, tags, ll, closed in ways:
        mm = tags.get('man_made')
        if mm not in ('pier', 'breakwater', 'groyne'):
            continue
        pts = rnd(simplify([m(*p) for p in ll], 0.5))
        name = tags.get('name', '')
        if mm == 'breakwater' or mm == 'groyne':
            out['breakwaters'].append(pts)
        elif name == 'Berkeley Pier' or name == 'Skates on the Bay':
            out['piers'].append({'name': name, 'p': pts, 'closed': closed})
        elif any(inside(*p) for p in ll):
            out['docks'].append({'p': pts, 'closed': closed})
    for wid, tags, ll, closed in ways:   # the long pier is an untagged-ish line in some extracts
        if tags.get('name') == 'Berkeley Pier' and not tags.get('man_made'):
            out['piers'].append({'name': 'Berkeley Pier', 'p': rnd([m(*p) for p in ll]), 'closed': False, 'line': True})

    # --- roads, from the City's centerlines ---
    with open(streets_path) as fh:
        streets = json.load(fh)
    out['roads'] = []
    for f in streets['features']:
        g = f['geometry']
        lines = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
        p = f['properties']
        name = (p.get('STREET') or p.get('SFEANME') or '').strip()
        cls = p.get('CLASS') or 'Local'
        for line in lines:
            if not any(inside(lon, lat, 0.004) for lon, lat in line):
                continue
            kind = 'fwy' if cls == 'Interstate' else 'ramp' if cls == 'Ramp' else 'art' if cls in ('Principal Arterial', 'Minor Arterial') else 'loc'
            pts = simplify([m(lon, lat) for lon, lat in line], 1.5)
            out['roads'].append({'n': name, 'k': kind, 'p': rnd(pts)})

    # --- named places the film points at ---
    def find(pred):
        for wid, tags, ll, closed in ways:
            if pred(tags):
                return centroid([m(*p) for p in ll])
        return None

    out['places'] = {
        'doubletree': find(lambda t: t.get('tourism') == 'hotel' and 'DoubleTree' in t.get('name', '')),
        'skates': find(lambda t: t.get('name') == 'Skates on the Bay'),
        'yachtClub': find(lambda t: t.get('name') == 'Berkeley Yacht Club'),
        'shorebird': find(lambda t: t.get('name') == 'Shorebird Nature Center'),
        'calSailing': find(lambda t: t.get('name') == 'Cal Sailing Club'),
        'chavez': find(lambda t: t.get('name') == 'César Chávez Park'),
        'southCoveWest': find(lambda t: t.get('name') == 'South Cove West Lot'),
        'southCoveEast': find(lambda t: t.get('name') == 'South Cove East Lot'),
        'marinaOffice': find(lambda t: t.get('name') == 'Berkeley Marina Office'),
        'pierBase': find(lambda t: t.get('name') == 'Berkeley Pier' and t.get('man_made') == 'pier'),
    }
    js = '// generated by ferry/tools/build-marina.py — do not edit\nF.GEO = ' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n'
    dest = sys.argv[3] if len(sys.argv) > 3 else 'ferry/js/marina-geo.js'
    with open(dest, 'w') as fh:
        fh.write(js)
    print(f"{dest}: {len(js) // 1024} KB · land {len(land)} pts · parks {len(out['parks'])} · lots {len(out['lots'])} · "
          f"buildings {len(out['buildings'])} · docks {len(out['docks'])} · roads {len(out['roads'])}")
    print('places', out['places'])


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
