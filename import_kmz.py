#import_kmz.py
import re, psycopg2, xml.etree.ElementTree as ET
from zipfile import ZipFile

DB = "dbname=Crimson host=localhost user=postgres password=Margad21"

with ZipFile("Нэгтгэсэн_КМЗ_2026он.kmz") as z:
    kml = z.read("doc.kml").decode("utf-8")

root = ET.fromstring(kml)
ns = {'kml': 'http://www.opengis.net/kml/2.2'}

conn = psycopg2.connect(DB)
cur = conn.cursor()

def parse_core_count(text):
    if not text: return None
    m = re.search(r'(\d+)\s*(кор|core|коре)', text, re.IGNORECASE)
    return int(m.group(1)) if m else None

def detect_node_type(name):
    n = name.lower()
    if 'муфт' in n:       return 'joint'
    if 'байр' in n:       return 'building'
    if 'сайт' in n:       return 'site'
    return 'client'

for pm in root.findall('.//kml:Placemark', ns):
    name = pm.find('kml:name', ns)
    desc = pm.find('kml:description', ns)
    n = name.text.strip() if name is not None and name.text else ''
    d = desc.text.strip() if desc is not None and desc.text else ''

    point = pm.find('.//kml:Point/kml:coordinates', ns)
    line  = pm.find('.//kml:LineString/kml:coordinates', ns)
    poly  = pm.find('.//kml:Polygon', ns)

    if point is not None:
        lng, lat, *_ = point.text.strip().split(',')
        cur.execute("""
            INSERT INTO map_nodes (name, description, node_type, location)
            VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
        """, (n, d, detect_node_type(n), float(lng), float(lat)))

    elif line is not None:
        raw = line.text.strip() if line.text else ''
        pts = [p.strip().split(',') for p in raw.split() if p.strip()]
        valid_pts = [p for p in pts if len(p) >= 2]
        if len(valid_pts) < 2:          # skip empty/degenerate lines
            continue
        wkt_pts = ', '.join(f"{p[0]} {p[1]}" for p in valid_pts)
        wkt = f"LINESTRING({wkt_pts})"
        cores = parse_core_count(n) or parse_core_count(d)
        cur.execute("""
            INSERT INTO cable_segments (name, core_count, cable_type, path)
            VALUES (%s, %s, 'fiber', ST_GeomFromText(%s, 4326))
        """, (n, cores, wkt))

conn.commit()
cur.close()
conn.close()
print("Done.")