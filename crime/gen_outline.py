# Generate a clean recognizable geographic polygon of India for the SVG Map background
# Bounds: Lon 68 to 97.5, Lat 7.0 to 37.5
# Canvas 600 x 720, padding 40

def project(lat, lon, width=600, height=720, padding=40):
    w_eff = width - 2 * padding
    h_eff = height - 2 * padding
    x = padding + ((lon - 68.0) / (97.5 - 68.0)) * w_eff
    y = padding + ((37.5 - lat) / (37.5 - 7.0)) * h_eff
    return [round(x, 1), round(y, 1)]

# Outline points of India's subcontinent from North (Kashmir/Ladakh) clockwise around India
outline_points = [
    [37.0, 74.5],  # Northern tip
    [36.8, 77.2],
    [35.5, 78.5],
    [34.5, 79.5],  # Ladakh East
    [32.5, 79.0],  # Himachal / Tibet border
    [30.5, 80.8],  # Uttarakhand East
    [29.0, 80.5],
    [28.0, 82.5],  # Nepal border (approx)
    [27.0, 85.0],
    [26.5, 88.0],  # Sikkim region
    [27.8, 88.5],  # Sikkim North
    [27.2, 89.0],
    [27.0, 92.0],  # Bhutan border
    [28.5, 94.5],  # Arunachal North
    [28.2, 97.0],  # Arunachal East
    [27.0, 96.5],
    [25.5, 95.0],  # Nagaland
    [24.0, 94.0],  # Manipur
    [22.5, 93.0],  # Mizoram South
    [23.5, 91.5],  # Tripura
    [25.0, 91.0],  # Meghalaya
    [25.5, 89.8],  # Bangladesh West border
    [23.5, 88.8],
    [21.5, 87.5],  # West Bengal / Odisha Coast (Bay of Bengal)
    [19.8, 86.0],  # Puri / Chilika
    [18.0, 84.0],  # Andhra Coast
    [16.0, 81.0],
    [14.0, 80.2],  # Chennai Coast
    [11.5, 79.8],  # Puducherry / Tamil Nadu Coast
    [9.5, 79.0],   # Palk Strait
    [8.1, 77.5],   # Kanyakumari (Southernmost tip)
    [8.8, 76.5],   # Kerala Coast (Arabian Sea)
    [10.5, 76.0],
    [12.5, 75.0],  # Karnataka Coast
    [15.0, 73.8],  # Goa
    [18.0, 73.0],  # Maharashtra / Konkan Coast
    [19.5, 72.8],  # Mumbai
    [20.5, 72.7],  # Daman
    [21.2, 72.8],  # Surat / Gulf of Khambhat
    [21.0, 70.0],  # Kathiawar / Saurashtra South
    [22.2, 69.0],  # Dwarka (Western tip)
    [23.0, 70.0],  # Gulf of Kutch
    [23.8, 68.5],  # Rann of Kutch (Westernmost boundary)
    [24.5, 71.0],  # Rajasthan border with Pakistan
    [26.0, 70.5],  # Jaisalmer
    [28.5, 72.5],  # Bikaner
    [30.5, 74.0],  # Punjab border
    [32.5, 74.8],  # Jammu border
    [34.5, 74.0],  # Kashmir West
    [37.0, 74.5]   # Close loop
]

svg_path_cmds = []
for i, pt in enumerate(outline_points):
    xy = project(pt[0], pt[1])
    cmd = 'M' if i == 0 else 'L'
    svg_path_cmds.append(f"{cmd} {xy[0]} {xy[1]}")
svg_path_cmds.append('Z')

path_str = " ".join(svg_path_cmds)
print("Subcontinent SVG Path:")
print(path_str)

with open('india_outline_path.txt', 'w') as f:
    f.write(path_str)

