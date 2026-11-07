import xml.etree.ElementTree as ET
import re

with open('downloaded_map_source.txt', 'r', encoding='utf-8') as f:
    content = f.read()

root = ET.fromstring(content)
paths = root.findall('.//{http://www.w3.org/2000/svg}path')

def parse_svg_path_points(d):
    # Tokens: commands (M, m, L, l, H, h, V, v, C, c, S, s, Q, q, T, t, A, a, Z, z) and numbers
    tokens = re.findall(r'([a-zA-Z]|[-+]?(?:\d*\.\d+|\d+))', d)
    curr_x, curr_y = 0.0, 0.0
    points = []
    
    i = 0
    cmd = 'M'
    while i < len(tokens):
        t = tokens[i]
        if t.isalpha():
            cmd = t
            i += 1
            continue
        
        # Numbers following cmd
        if cmd == 'M':
            curr_x = float(t)
            curr_y = float(tokens[i+1])
            points.append((curr_x, curr_y))
            i += 2
            cmd = 'L'
        elif cmd == 'm':
            curr_x += float(t)
            curr_y += float(tokens[i+1])
            points.append((curr_x, curr_y))
            i += 2
            cmd = 'l'
        elif cmd == 'L':
            curr_x = float(t)
            curr_y = float(tokens[i+1])
            points.append((curr_x, curr_y))
            i += 2
        elif cmd == 'l':
            curr_x += float(t)
            curr_y += float(tokens[i+1])
            points.append((curr_x, curr_y))
            i += 2
        elif cmd == 'H':
            curr_x = float(t)
            points.append((curr_x, curr_y))
            i += 1
        elif cmd == 'h':
            curr_x += float(t)
            points.append((curr_x, curr_y))
            i += 1
        elif cmd == 'V':
            curr_y = float(t)
            points.append((curr_x, curr_y))
            i += 1
        elif cmd == 'v':
            curr_y += float(t)
            points.append((curr_x, curr_y))
            i += 1
        elif cmd in ['C', 'c', 'S', 's', 'Q', 'q', 'T', 't']:
            # approximate by end point
            # cubic bezier takes 6 numbers
            step = 6 if cmd in ['C', 'c'] else 4
            if cmd.isupper():
                curr_x = float(tokens[i + step - 2])
                curr_y = float(tokens[i + step - 1])
            else:
                curr_x += float(tokens[i + step - 2])
                curr_y += float(tokens[i + step - 1])
            points.append((curr_x, curr_y))
            i += step
        elif cmd in ['A', 'a']:
            step = 7
            if cmd.isupper():
                curr_x = float(tokens[i + 5])
                curr_y = float(tokens[i + 6])
            else:
                curr_x += float(tokens[i + 5])
                curr_y += float(tokens[i + 6])
            points.append((curr_x, curr_y))
            i += step
        elif cmd in ['Z', 'z']:
            i += 1
        else:
            i += 1
            
    return points

centroids = {}
for p in paths:
    pid = p.get('id')
    name = p.get('name')
    d = p.get('d')
    pts = parse_svg_path_points(d)
    if pts:
        xs = [pt[0] for pt in pts]
        ys = [pt[1] for pt in pts]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        # Average point for centroid
        avg_x = sum(xs) / len(xs)
        avg_y = sum(ys) / len(ys)
        mid_x = (min_x + max_x) / 2
        mid_y = (min_y + max_y) / 2
        # weighted blend
        cx = round((avg_x + mid_x) / 2, 1)
        cy = round((avg_y + mid_y) / 2, 1)
        centroids[pid] = {
            'cx': cx,
            'cy': cy,
            'min_x': round(min_x, 1),
            'max_x': round(max_x, 1),
            'min_y': round(min_y, 1),
            'max_y': round(max_y, 1),
            'width': round(max_x - min_x, 1),
            'height': round(max_y - min_y, 1)
        }
        print(f'{pid:5s} {name:30s} -> Center: ({cx:5.1f}, {cy:5.1f}) Box: {round(max_x-min_x):3d}x{round(max_y-min_y):3d}')


