import xml.etree.ElementTree as ET
import json
import re

# Name alignment between Simplemaps SVG and NCRB Table 1A.1
name_map = {
    'INAN': 'Andaman and Nicobar Islands',
    'INTG': 'Telangana',
    'INAP': 'Andhra Pradesh',
    'INAR': 'Arunachal Pradesh',
    'INAS': 'Assam',
    'INBR': 'Bihar',
    'INCH': 'Chandigarh',
    'INCT': 'Chhattisgarh',
    'INDH': 'Dadra and Nagar Haveli and Daman and Diu',
    'INDL': 'Delhi',
    'INGA': 'Goa',
    'INGJ': 'Gujarat',
    'INHR': 'Haryana',
    'INHP': 'Himachal Pradesh',
    'INJH': 'Jharkhand',
    'INKA': 'Karnataka',
    'INKL': 'Kerala',
    'INMP': 'Madhya Pradesh',
    'INMH': 'Maharashtra',
    'INMN': 'Manipur',
    'INML': 'Meghalaya',
    'INMZ': 'Mizoram',
    'INNL': 'Nagaland',
    'INOR': 'Odisha',
    'INPY': 'Puducherry',
    'INPB': 'Punjab',
    'INRJ': 'Rajasthan',
    'INSK': 'Sikkim',
    'INTN': 'Tamil Nadu',
    'INTR': 'Tripura',
    'INUP': 'Uttar Pradesh',
    'INUT': 'Uttarakhand',
    'INWB': 'West Bengal',
    'INLD': 'Lakshadweep',
    'INJK': 'Jammu and Kashmir',
    'INLA': 'Ladakh'
}

with open('downloaded_map_source.txt', 'r', encoding='utf-8') as f:
    content = f.read()

root = ET.fromstring(content)
paths = root.findall('.//{http://www.w3.org/2000/svg}path')

# Load computed centroids
with open('data.json', 'r', encoding='utf-8') as f:
    ncrb_data = json.load(f)

ncrb_by_name = {e['name']: e for e in ncrb_data['entities']}

# Accurate centroids
centroids_map = {
    'INAN': {'cx': 783.0, 'cy': 837.2},
    'INTG': {'cx': 404.4, 'cy': 643.2},
    'INAP': {'cx': 436.0, 'cy': 699.4},
    'INAR': {'cx': 825.8, 'cy': 341.1},
    'INAS': {'cx': 770.3, 'cy': 399.3},
    'INBR': {'cx': 581.0, 'cy': 406.2},
    'INCH': {'cx': 334.8, 'cy': 254.8},
    'INCT': {'cx': 482.6, 'cy': 548.7},
    'INDH': {'cx': 234.0, 'cy': 574.8},
    'INDL': {'cx': 344.0, 'cy': 320.8},
    'INGA': {'cx': 259.9, 'cy': 714.4},
    'INGJ': {'cx': 186.9, 'cy': 508.0},
    'INHR': {'cx': 319.1, 'cy': 302.0},
    'INHP': {'cx': 350.2, 'cy': 217.1},
    'INJH': {'cx': 579.5, 'cy': 473.1},
    'INKA': {'cx': 325.3, 'cy': 725.0},
    'INKL': {'cx': 318.6, 'cy': 845.2},
    'INMP': {'cx': 378.3, 'cy': 461.6},
    'INMH': {'cx': 329.2, 'cy': 607.2},
    'INMN': {'cx': 802.8, 'cy': 439.6},
    'INML': {'cx': 732.7, 'cy': 415.0},
    'INMZ': {'cx': 774.0, 'cy': 483.2},
    'INNL': {'cx': 816.0, 'cy': 399.9},
    'INOR': {'cx': 541.6, 'cy': 573.8},
    'INPY': {'cx': 389.9, 'cy': 782.2},
    'INPB': {'cx': 300.3, 'cy': 247.4},
    'INRJ': {'cx': 272.1, 'cy': 392.2},
    'INSK': {'cx': 655.0, 'cy': 353.7},
    'INTN': {'cx': 378.0, 'cy': 837.6},
    'INTR': {'cx': 746.4, 'cy': 469.6},
    'INUP': {'cx': 437.5, 'cy': 375.8},
    'INUT': {'cx': 402.3, 'cy': 275.3},
    'INWB': {'cx': 646.1, 'cy': 466.7},
    'INLD': {'cx': 229.0, 'cy': 858.6},
    'INJK': {'cx': 293.1, 'cy': 157.0},
    'INLA': {'cx': 345.0, 'cy': 135.0}
}

map_entities = []

for p in paths:
    pid = p.get('id')
    ncrb_name = name_map.get(pid, p.get('name'))
    d = p.get('d')
    c_info = centroids_map.get(pid, {'cx': 500, 'cy': 500})
    
    ncrb_item = ncrb_by_name.get(ncrb_name)
    code = ncrb_item['code'] if ncrb_item else pid[2:]
    
    map_entities.append({
        'id': pid,
        'name': ncrb_name,
        'code': code,
        'cx': c_info['cx'],
        'cy': c_info['cy'],
        'd': d
    })

print(f"Processed {len(map_entities)} map paths.")

js_code = "window.INDIA_MAP_PATHS = " + json.dumps(map_entities, indent=2, ensure_ascii=False) + ";\n"

with open('india_map_paths.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print("Successfully written india_map_paths.js!")

