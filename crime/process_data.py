import csv
import json

def process_crime_data():
    with open('NCRB_Table_1A.1.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = [r for r in reader if r and len(r) >= 8]

    region_map = {
        'Jammu and Kashmir': 'North',
        'Ladakh': 'North',
        'Himachal Pradesh': 'North',
        'Punjab': 'North',
        'Chandigarh': 'North',
        'Uttarakhand': 'North',
        'Haryana': 'North',
        'Delhi': 'North',
        'Rajasthan': 'North',
        'Uttar Pradesh': 'North',
        
        'Bihar': 'East',
        'Jharkhand': 'East',
        'Odisha': 'East',
        'West Bengal': 'East',
        'Andaman and Nicobar Islands': 'East',
        
        'Chhattisgarh': 'Central',
        'Madhya Pradesh': 'Central',
        
        'Gujarat': 'West',
        'Maharashtra': 'West',
        'Goa': 'West',
        'Dadra and Nagar Haveli and Daman and Diu': 'West',
        
        'Andhra Pradesh': 'South',
        'Karnataka': 'South',
        'Kerala': 'South',
        'Tamil Nadu': 'South',
        'Telangana': 'South',
        'Puducherry': 'South',
        'Lakshadweep': 'South',
        
        'Arunachal Pradesh': 'Northeast',
        'Assam': 'Northeast',
        'Manipur': 'Northeast',
        'Meghalaya': 'Northeast',
        'Mizoram': 'Northeast',
        'Nagaland': 'Northeast',
        'Sikkim': 'Northeast',
        'Tripura': 'Northeast'
    }

    code_map = {
        'Andhra Pradesh': 'AP',
        'Arunachal Pradesh': 'AR',
        'Assam': 'AS',
        'Bihar': 'BR',
        'Chhattisgarh': 'CG',
        'Goa': 'GA',
        'Gujarat': 'GJ',
        'Haryana': 'HR',
        'Himachal Pradesh': 'HP',
        'Jharkhand': 'JH',
        'Karnataka': 'KA',
        'Kerala': 'KL',
        'Madhya Pradesh': 'MP',
        'Maharashtra': 'MH',
        'Manipur': 'MN',
        'Meghalaya': 'ML',
        'Mizoram': 'MZ',
        'Nagaland': 'NL',
        'Odisha': 'OD',
        'Punjab': 'PB',
        'Rajasthan': 'RJ',
        'Sikkim': 'SK',
        'Tamil Nadu': 'TN',
        'Telangana': 'TS',
        'Tripura': 'TR',
        'Uttar Pradesh': 'UP',
        'Uttarakhand': 'UK',
        'West Bengal': 'WB',
        'Andaman and Nicobar Islands': 'AN',
        'Chandigarh': 'CH',
        'Dadra and Nagar Haveli and Daman and Diu': 'DH',
        'Delhi': 'DL',
        'Jammu and Kashmir': 'JK',
        'Ladakh': 'LA',
        'Lakshadweep': 'LD',
        'Puducherry': 'PY'
    }

    grid_coords = {
        'Ladakh': [0, 3],
        'Jammu and Kashmir': [0, 2],
        'Himachal Pradesh': [1, 2],
        'Punjab': [1, 1],
        'Chandigarh': [1, 3],
        'Uttarakhand': [1, 4],
        'Haryana': [2, 2],
        'Delhi': [2, 3],
        'Sikkim': [2, 6],
        'Arunachal Pradesh': [2, 8],
        'Rajasthan': [3, 1],
        'Uttar Pradesh': [3, 3],
        'Bihar': [3, 5],
        'Assam': [3, 7],
        'Nagaland': [3, 8],
        'Gujarat': [4, 0],
        'Madhya Pradesh': [4, 2],
        'Jharkhand': [4, 4],
        'West Bengal': [4, 5],
        'Meghalaya': [4, 7],
        'Manipur': [4, 8],
        'Dadra and Nagar Haveli and Daman and Diu': [5, 0],
        'Maharashtra': [5, 2],
        'Chhattisgarh': [5, 3],
        'Odisha': [5, 4],
        'Tripura': [5, 7],
        'Mizoram': [5, 8],
        'Goa': [6, 1],
        'Karnataka': [6, 2],
        'Telangana': [6, 3],
        'Andhra Pradesh': [7, 3],
        'Puducherry': [7, 4],
        'Kerala': [8, 2],
        'Tamil Nadu': [8, 3],
        'Lakshadweep': [8, 0],
        'Andaman and Nicobar Islands': [8, 6]
    }

    geo_coords = {
        'Ladakh': [34.5, 77.8],
        'Jammu and Kashmir': [33.8, 75.0],
        'Himachal Pradesh': [31.8, 77.2],
        'Punjab': [31.1, 75.4],
        'Chandigarh': [30.7, 76.8],
        'Uttarakhand': [30.1, 79.1],
        'Haryana': [29.1, 76.2],
        'Delhi': [28.6, 77.1],
        'Rajasthan': [26.8, 73.8],
        'Uttar Pradesh': [27.0, 80.8],
        'Bihar': [25.4, 85.4],
        'Sikkim': [27.5, 88.5],
        'Assam': [26.2, 92.9],
        'Arunachal Pradesh': [28.2, 94.7],
        'Nagaland': [26.1, 94.5],
        'Manipur': [24.7, 93.9],
        'Mizoram': [23.3, 92.9],
        'Tripura': [23.8, 91.8],
        'Meghalaya': [25.5, 91.4],
        'West Bengal': [23.5, 87.8],
        'Jharkhand': [23.6, 85.3],
        'Odisha': [20.5, 84.8],
        'Chhattisgarh': [21.5, 81.8],
        'Madhya Pradesh': [23.3, 77.8],
        'Gujarat': [22.4, 71.5],
        'Dadra and Nagar Haveli and Daman and Diu': [20.4, 72.9],
        'Maharashtra': [19.5, 75.5],
        'Goa': [15.3, 74.1],
        'Karnataka': [14.5, 75.8],
        'Telangana': [17.8, 79.1],
        'Andhra Pradesh': [15.5, 79.8],
        'Tamil Nadu': [11.2, 78.7],
        'Kerala': [10.4, 76.4],
        'Puducherry': [11.9, 79.8],
        'Lakshadweep': [10.5, 72.6],
        'Andaman and Nicobar Islands': [11.7, 92.7]
    }

    # Map bounds for 600x720 canvas
    # Lon: 68.0 to 97.5 (width: 29.5 deg)
    # Lat: 7.0 to 37.5 (height: 30.5 deg)
    def project_geo(lat, lon, width=600, height=720, padding=40):
        w_eff = width - 2 * padding
        h_eff = height - 2 * padding
        x = padding + ((lon - 68.0) / (97.5 - 68.0)) * w_eff
        y = padding + ((37.5 - lat) / (37.5 - 7.0)) * h_eff
        return [round(x, 1), round(y, 1)]

    states_data = []
    uts_data = []
    summary_data = {}
    all_items = []

    for r in rows:
        sl = r[0].strip()
        name = r[1].strip()
        c2020 = int(float(r[2].strip()))
        c2021 = int(float(r[3].strip()))
        c2022 = int(float(r[4].strip()))
        pop2022 = float(r[5].strip())
        rate2022 = float(r[6].strip())
        cs_rate2022 = float(r[7].strip())

        growth_21_22 = round(((c2022 - c2021) / c2021 * 100), 2) if c2021 else 0
        growth_20_22 = round(((c2022 - c2020) / c2020 * 100), 2) if c2020 else 0

        lat_lon = geo_coords.get(name, [20.0, 78.0])
        svg_xy = project_geo(lat_lon[0], lat_lon[1])

        item = {
            'slNo': sl,
            'name': name,
            'code': code_map.get(name, name[:2].upper()),
            'crimes2020': c2020,
            'crimes2021': c2021,
            'crimes2022': c2022,
            'populationLakhs2022': pop2022,
            'populationActual2022': int(pop2022 * 100000),
            'crimeRate2022': rate2022,
            'chargesheetingRate2022': cs_rate2022,
            'growth2021to2022': growth_21_22,
            'growth2020to2022': growth_20_22,
            'region': region_map.get(name, 'Other'),
            'gridCoord': grid_coords.get(name, [0, 0]),
            'geoCoords': lat_lon,
            'svgCoords': svg_xy
        }

        if sl.isdigit():
            sl_num = int(sl)
            if sl_num <= 28:
                item['type'] = 'State'
                states_data.append(item)
            else:
                item['type'] = 'UT'
                uts_data.append(item)
            all_items.append(item)
        else:
            if 'Total State' in name:
                item['type'] = 'Summary_State'
                summary_data['statesTotal'] = item
            elif 'Total UT' in name:
                item['type'] = 'Summary_UT'
                summary_data['utsTotal'] = item
            elif 'Total All India' in name:
                item['type'] = 'Summary_AllIndia'
                summary_data['allIndiaTotal'] = item

    # Rankings
    sorted_by_rate = sorted(all_items, key=lambda x: x['crimeRate2022'], reverse=True)
    for rank, itm in enumerate(sorted_by_rate, 1):
        itm['crimeRateRank'] = rank

    sorted_by_cs = sorted(all_items, key=lambda x: x['chargesheetingRate2022'], reverse=True)
    for rank, itm in enumerate(sorted_by_cs, 1):
        itm['chargesheetingRank'] = rank

    sorted_by_vol = sorted(all_items, key=lambda x: x['crimes2022'], reverse=True)
    for rank, itm in enumerate(sorted_by_vol, 1):
        itm['volumeRank'] = rank

    nat_rate = summary_data['allIndiaTotal']['crimeRate2022']
    nat_cs = summary_data['allIndiaTotal']['chargesheetingRate2022']

    for itm in all_items:
        r = itm['crimeRate2022']
        cs = itm['chargesheetingRate2022']
        if r >= nat_rate and cs >= nat_cs:
            itm['quadrant'] = 'High Crime - High Chargesheet'
            itm['quadrantColor'] = '#f59e0b'
            itm['quadrantDesc'] = 'High Crime Activity with Strong Chargesheeting Efficiency'
            itm['quadrantCode'] = 'Q1'
        elif r >= nat_rate and cs < nat_cs:
            itm['quadrant'] = 'High Crime - Low Chargesheet'
            itm['quadrantColor'] = '#ef4444'
            itm['quadrantDesc'] = 'High Crime Vulnerability & Low Police Resolution'
            itm['quadrantCode'] = 'Q2'
        elif r < nat_rate and cs >= nat_cs:
            itm['quadrant'] = 'Low Crime - High Chargesheet'
            itm['quadrantColor'] = '#10b981'
            itm['quadrantDesc'] = 'Lower Crime Density with Above-Average Resolution'
            itm['quadrantCode'] = 'Q3'
        else:
            itm['quadrant'] = 'Low Crime - Low Chargesheet'
            itm['quadrantColor'] = '#6366f1'
            itm['quadrantDesc'] = 'Low Crime Density with Procedural Delays'
            itm['quadrantCode'] = 'Q4'

    all_crimes_2020 = summary_data['allIndiaTotal']['crimes2020']
    all_crimes_2021 = summary_data['allIndiaTotal']['crimes2021']
    all_crimes_2022 = summary_data['allIndiaTotal']['crimes2022']
    
    analytics = {
        'totalCrimes2022': all_crimes_2022,
        'totalCrimes2021': all_crimes_2021,
        'totalCrimes2020': all_crimes_2020,
        'nationalCrimeRate': nat_rate,
        'nationalChargesheetingRate': nat_cs,
        'nationalPopulationLakhs': summary_data['allIndiaTotal']['populationLakhs2022'],
        'nationalPopulationActual': int(summary_data['allIndiaTotal']['populationLakhs2022'] * 100000),
        'crimeChange2021_2022_pct': round(((all_crimes_2022 - all_crimes_2021) / all_crimes_2021 * 100), 2),
        'crimeChange2020_2022_pct': round(((all_crimes_2022 - all_crimes_2020) / all_crimes_2020 * 100), 2),
        'top5HighCrimeRate': sorted_by_rate[:5],
        'top5LowestCrimeRate': sorted_by_rate[-5:],
        'top5HighestChargesheet': sorted_by_cs[:5],
        'top5LowestChargesheet': sorted_by_cs[-5:],
        'top5AbsoluteVolume': sorted_by_vol[:5]
    }

    # Regional summaries
    regions = {}
    for itm in all_items:
        reg = itm['region']
        if reg not in regions:
            regions[reg] = {
                'name': reg,
                'totalCrimes2022': 0,
                'populationLakhs': 0,
                'chargesheetSum': 0,
                'count': 0,
                'states': []
            }
        regions[reg]['totalCrimes2022'] += itm['crimes2022']
        regions[reg]['populationLakhs'] += itm['populationLakhs2022']
        regions[reg]['chargesheetSum'] += itm['chargesheetingRate2022']
        regions[reg]['count'] += 1
        regions[reg]['states'].append(itm['name'])

    for reg, reg_data in regions.items():
        reg_data['avgChargesheetingRate'] = round(reg_data['chargesheetSum'] / reg_data['count'], 2)
        reg_data['crimeRate'] = round((reg_data['totalCrimes2022'] / reg_data['populationLakhs']), 2) if reg_data['populationLakhs'] else 0

    output = {
        'metadata': {
            'title': 'NCRB Crime in India - Cognizable Crimes (IPC) 2020-2022',
            'sourceTable': 'Table 1A.1',
            'publisher': 'National Crime Records Bureau (NCRB), Ministry of Home Affairs, Govt. of India',
            'generatedAt': '2026-11-07',
            'dataYears': [2020, 2021, 2022]
        },
        'summary': summary_data,
        'analytics': analytics,
        'regions': regions,
        'entities': all_items,
        'states': states_data,
        'uts': uts_data
    }

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    with open('dataset.js', 'w', encoding='utf-8') as f:
        f.write('window.NCRB_DATA = ' + json.dumps(output, indent=2, ensure_ascii=False) + ';\n')

    print("Generated data.json and dataset.js with geo coordinates and regional summaries!")

if __name__ == '__main__':
    process_crime_data()
