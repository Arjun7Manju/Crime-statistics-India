# NCRB CrimeStat India | Cognizable Crimes (IPC) Analytics (2020–2022)

An interactive, high-fidelity data intelligence and analytics web application built using official **National Crime Records Bureau (NCRB)** data: **Table 1A.1 — "State/UT-wise Cognizable Crimes (IPC) Reported and Rate of Cognizable Crimes (IPC) during 2020-2022"**, published by the Ministry of Home Affairs, Government of India.

---

## 🚀 Quick Start / How to Run

You have two convenient ways to run the website:

### Method 1: Instant Local Browser View (Zero dependencies)
Simply **double-click** [`index.html`](file:///c:/Users/hp/OneDrive/Desktop/crime/index.html) in any browser (Chrome, Edge, Firefox, Brave, Safari).
The application is pre-bundled with [`dataset.js`](file:///c:/Users/hp/OneDrive/Desktop/crime/dataset.js) and works out of the box with zero server setup required!

### Method 2: Local HTTP Server (Recommended)
Double-click [`start.bat`](file:///c:/Users/hp/OneDrive/Desktop/crime/start.bat) or run in terminal:
```bash
python server.py
```
This automatically boots a local HTTP server on `http://localhost:3000` (or next free port) and opens your default browser.

---

## 📊 Core Features & Capabilities

### 1. Executive National KPI Ribbon
- **Total Cognizable Crimes 2022**: 3,561,379 (-2.8% YoY vs 2021, -16.3% vs 2020 post-lockdown normalization).
- **National Crime Rate (IPC)**: 258.1 per 100,000 population (Delhi highest at 1,424.1, Nagaland lowest at 45.4).
- **Chargesheeting Rate**: 71.3% national resolution benchmark (Kerala highest at 96.0%, Manipur lowest at 10.4%).
- **Tracked Population**: 1.38 Billion (13,797.5 Lakhs) Mid-Year Projected Population 2022.

### 2. Multi-Mode Interactive Crime Map Studio
- **Full Interactive Vector Map of India**:
  - Detailed, authentic vector boundaries for all 36 States and Union Territories.
  - **Dynamic Choropleth Fill**: Colors change in real-time according to crime density, incidence rate, chargesheeting %, or 3-year growth.
  - **Crime Hotspot Bubbles (Proportional Circles)**: Pulsating circles on each state centered on its centroid, sized proportionally to crime volume (e.g. large hotspots over UP, Maharashtra, Delhi, and Kerala).
  - **Interactive Time-Lapse Player**: Play/Pause button and year selector (`2020`, `2021`, `2022`) to watch crime numbers and patterns evolve across the 3 years.
  - **Zoom & Pan Engine**: Smooth click-and-drag pan, mouse-wheel zoom, and `+` / `-` / `Reset` floating controls.
  - **Regional Focus Filter**: Instant buttons to focus and zoom on `All India (36)`, `North (10)`, `South (7)`, `East (5)`, `West (4)`, `Central (2)`, or `Northeast (8)`.
  - **Live State Crime Inspector**: Side panel automatically updating on hover/click with real-time stats, 3-year shift comparison, and link to full dossier.
- **Uniform 9x9 Equal-Area Cartogram Grid**: Eliminates the geographic distortion of standard maps so small jurisdictions like Delhi, Chandigarh, Goa, Puducherry, and Lakshadweep receive equal visual weight.
- **Ranked Choropleth Matrix**: Ordered visual list comparing every state with dynamic heat progress bars.

### 3. Visual Analytics & Chart Studio (Chart.js)
1. **3-Year Trajectory of Top States (2020 vs 2021 vs 2022)**: Visualizes massive shifts such as Tamil Nadu's -78.2% and Gujarat's -64.7% drops following the expiration of pandemic lockdown violation cases booked under Section 188 IPC.
2. **Policing Efficiency Quadrant Matrix (Scatter Plot)**:
   - **Q1 (High Crime, High Chargesheet)**: Active reporting paired with high investigation speed (e.g., Kerala).
   - **Q2 (High Crime, Low Chargesheet)**: High crime vulnerability and overburdened police (e.g., Delhi, Haryana).
   - **Q3 (Low Crime, High Chargesheet)**: Stable communal environment with high resolution efficiency (e.g., Gujarat, West Bengal, Andhra Pradesh).
   - **Q4 (Low Crime, Low Chargesheet)**: Low crime density with procedural bottlenecks (e.g., Manipur, Meghalaya, Assam).
3. **States vs. Union Territories Disparity**: Side-by-side analysis illustrating how UTs register 3.5x higher crime rate (848.4 vs 240.7) yet achieve less than half the chargesheet rate (35.6% vs 74.9%).
4. **Regional Zonal Radar**: Compares North, South, East, West, Central, and Northeast regional aggregates.
5. **Crime Rate Extremes**: Top 5 highest rate jurisdictions vs. Top 5 safest jurisdictions.

### 4. Head-to-Head Jurisdiction Comparison Studio
- Select any three States or UTs side-by-side (e.g. Delhi vs Kerala vs Uttar Pradesh).
- Displays head-to-head delta cards, multi-axis comparison radar, and detailed differential metrics.

### 5. Comprehensive Data Explorer & Table
- Searchable by name, abbreviation code, or geographic region.
- Filterable by Category (All, 28 States, 8 Union Territories) and by Quadrant (Q1 to Q4).
- Sortable on every column (ascending / descending).
- One-click **Export to CSV** and **Export to JSON**.

### 6. State Intelligence Dossier (Drawer Modal)
- Clicking any state node, cartogram tile, or table row slides open a detailed profile containing:
  - National rankings (Crime Volume Rank, Crime Rate Rank, Chargesheeting Rank).
  - Investigation Grade rating (A+ to D).
  - Mini 3-year crime trajectory line chart.
  - Contextual analytical policy commentary explaining the institutional factors behind that jurisdiction's numbers.
  - Print / PDF summary action.

### 7. Executive Policy Insights
Curated, editorial-grade briefings on:
- The 2020 Lockdown IPC Sec. 188 Anomaly
- The Capital Disparity (Delhi's 1,424.1 crime rate)
- The Investigation Leader (Kerala's 96.0% chargesheeting rate)
- North-Eastern Safety vs Resolution Bottlenecks
- States vs UTs Institutional Divide
- Absolute Volume vs Per-Capita Reality

---

## 📂 Project Structure

```text
crime/
├── index.html            # Main Single-Page Web Application
├── style.css             # Custom glassmorphism, responsive styles, animations
├── app.js                # Core interactive controller, Chart.js instances, state logic
├── dataset.js            # Pre-bundled JSON data in JS variable (zero-server offline mode)
├── data.json             # Processed JSON dataset with geo/grid coordinates & analytics
├── NCRB_Table_1A.1.csv   # Cleaned original NCRB Table 1A.1 dataset
├── process_data.py       # Python dataset processor & analytics calculator
├── server.py             # Local development HTTP server with auto browser launch
├── start.bat             # 1-click Windows server launcher
└── README.md             # Project documentation & reference
```

---

## 📜 Dataset Citation
- **Source**: *Crime in India 2022* (Table 1A.1)
- **Publisher**: National Crime Records Bureau (NCRB), Ministry of Home Affairs, Government of India
- **Coverage**: 28 States & 8 Union Territories (2020, 2021, 2022)

