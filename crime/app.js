/**
 * NCRB CrimeStat India Portal - Interactive Analytics & Vector Map Application
 * Powered by NCRB Table 1A.1 Dataset (2020-2022) & Vector Boundaries
 */

(function () {
  'use strict';

  // Application State
  const state = {
    data: null,
    mapPaths: null,
    activeYear: 2022, // 2020 | 2021 | 2022
    activeMetric: 'crimesYear', // 'crimesYear' | 'crimeRate2022' | 'chargesheetingRate2022' | 'growth2020to2022' | 'populationLakhs2022'
    activeViewMode: 'geo', // 'geo' | 'cartogram' | 'ranking'
    filterType: 'ALL', // 'ALL' | 'State' | 'UT'
    filterQuadrant: 'ALL', // 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
    filterRegion: 'ALL', // 'ALL' | 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast'
    showBubbles: true,
    showLabels: true,
    isTimeLapsePlaying: false,
    timeLapseTimer: null,
    searchQuery: '',
    sortColumn: 'crimes2022',
    sortDirection: 'desc',
    selectedState: null,
    hoveredState: null,
    compareStates: ['Delhi', 'Kerala', 'Uttar Pradesh'],
    isDark: true,
    mapTransform: { x: 0, y: 0, scale: 1 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    charts: {}
  };

  // Metric Configuration
  const METRICS = {
    crimesYear: {
      label: 'Reported IPC Crimes',
      shortLabel: 'IPC Crimes',
      getVal: (item, year) => item[`crimes${year}`] || item.crimes2022,
      format: (val) => Number(val).toLocaleString(),
      unit: '',
      higherIsBetter: false,
      description: 'Total volume of Cognizable IPC Crimes registered in the selected year',
      min: 64,
      max: 891700, // Tamil Nadu 2020 was 891,700
      benchmark: null
    },
    crimeRate2022: {
      label: 'Crime Rate (IPC) per 100k',
      shortLabel: 'Crime Rate',
      getVal: (item) => item.crimeRate2022,
      format: (val) => val.toFixed(1),
      unit: '/100k',
      higherIsBetter: false, // Low crime rate is desirable
      description: 'Incidence of Cognizable IPC Crimes per 100,000 Mid-Year Projected Population in 2022',
      min: 45.4,
      max: 1424.1,
      benchmark: 258.1,
      benchmarkLabel: 'All India Avg: 258.1'
    },
    chargesheetingRate2022: {
      label: 'Chargesheeting Rate (%)',
      shortLabel: 'Chargesheeting',
      getVal: (item) => item.chargesheetingRate2022,
      format: (val) => `${val.toFixed(1)}%`,
      unit: '%',
      higherIsBetter: true, // Higher resolution rate is desirable
      description: 'Percentage of investigated cases where police filed formal chargesheets before courts',
      min: 10.4,
      max: 96.0,
      benchmark: 71.3,
      benchmarkLabel: 'All India Avg: 71.3%'
    },
    growth2020to2022: {
      label: '3-Year Trend (% 2020-22)',
      shortLabel: '3-Yr Trend',
      getVal: (item) => item.growth2020to2022,
      format: (val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`,
      unit: '%',
      higherIsBetter: false,
      description: 'Percentage change in reported cognizable crimes from 2020 to 2022',
      min: -78.25,
      max: 168.48,
      benchmark: -16.29,
      benchmarkLabel: 'National Trend: -16.3%'
    },
    populationLakhs2022: {
      label: 'Population (Lakhs)',
      shortLabel: 'Population',
      getVal: (item) => item.populationLakhs2022,
      format: (val) => `${Number(val).toLocaleString()} L`,
      unit: ' Lakhs',
      higherIsBetter: null,
      description: 'Mid-Year Projected Population in Lakhs (1 Lakh = 100,000)',
      min: 0.7,
      max: 2340.9,
      benchmark: null
    }
  };

  // Color Interpolation for Heatmaps
  function getMetricColor(value, metricKey) {
    const config = METRICS[metricKey];
    if (!config || value === undefined || value === null) return '#334155';

    const min = config.min;
    const max = config.max;
    let norm = (value - min) / (max - min);
    norm = Math.max(0, Math.min(1, norm));

    if (config.higherIsBetter === false) {
      // High is Red (Elevated Crime), Low is Green/Emerald
      if (norm < 0.15) return '#10b981'; // Emerald
      if (norm < 0.35) return '#06b6d4'; // Cyan
      if (norm < 0.55) return '#f59e0b'; // Amber
      if (norm < 0.80) return '#ef4444'; // Red
      return '#b91c1c'; // Deep Crimson
    } else if (config.higherIsBetter === true) {
      // High is Green (Efficient), Low is Red
      if (norm < 0.30) return '#ef4444';
      if (norm < 0.60) return '#f59e0b';
      if (norm < 0.80) return '#06b6d4';
      return '#10b981';
    } else {
      // Neutral (Population): Indigo to Purple
      if (norm < 0.20) return '#0284c7';
      if (norm < 0.50) return '#3b82f6';
      if (norm < 0.75) return '#6366f1';
      return '#8b5cf6';
    }
  }

  // Initialize Application
  async function init() {
    try {
      // Load Data
      if (window.NCRB_DATA) {
        state.data = window.NCRB_DATA;
      } else {
        const resp = await fetch('data.json');
        state.data = await resp.json();
      }

      // Load Map Paths
      if (window.INDIA_MAP_PATHS) {
        state.mapPaths = window.INDIA_MAP_PATHS;
      }

      console.log('NCRB Portal Loaded successfully with', state.data.entities.length, 'entities and', state.mapPaths ? state.mapPaths.length : 0, 'vector paths');

      // Set initial state inspector
      state.hoveredState = state.data.entities.find(e => e.name === 'Delhi') || state.data.entities[0];

      // Setup UI & Events
      setupEventListeners();
      renderHeroCards();
      renderMapLegend();
      renderActiveView();
      updateLiveInspector(state.hoveredState.name);
      renderCharts();
      renderComparisonStudio();
      renderDataTable();
      renderInsights();
      populateDropdowns();

      // Check URL hash for direct state link
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const found = state.data.entities.find(e => e.code.toLowerCase() === hash.toLowerCase() || e.name.toLowerCase() === decodeURIComponent(hash).toLowerCase());
        if (found) openStateDrawer(found.name);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      showErrorState(err.message);
    }
  }

  // Hero KPI Ribbon
  function renderHeroCards() {
    const analytics = state.data.analytics;
    const summary = state.data.summary;
    const allIndia = summary.allIndiaTotal;

    const kpi1 = document.getElementById('kpi-total-crimes');
    if (kpi1) {
      kpi1.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Cognizable IPC Crimes</p>
            <h3 class="text-3xl font-extrabold text-white mt-1 font-mono-numbers">${allIndia.crimes2022.toLocaleString()}</h3>
          </div>
          <span class="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </span>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="inline-flex items-center text-emerald-400 font-medium">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
            ${analytics.crimeChange2021_2022_pct}% YoY vs 2021
          </span>
          <span class="text-slate-400 font-mono-numbers">${analytics.crimeChange2020_2022_pct}% 3-Yr Trend</span>
        </div>
        <p class="text-[11px] text-slate-400 mt-2">Normalization following 2020 pandemic lockdown violation surges.</p>
      `;
    }

    const kpi2 = document.getElementById('kpi-crime-rate');
    if (kpi2) {
      kpi2.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold">National Crime Rate</p>
            <h3 class="text-3xl font-extrabold text-cyan-400 mt-1 font-mono-numbers">${allIndia.crimeRate2022} <span class="text-sm font-normal text-slate-400">/ 100k</span></h3>
          </div>
          <span class="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </span>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="text-rose-400 font-medium">Highest: Delhi (${state.data.entities.find(e => e.name === 'Delhi').crimeRate2022})</span>
          <span class="text-emerald-400 font-medium">Lowest: Nagaland (${state.data.entities.find(e => e.name === 'Nagaland').crimeRate2022})</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div class="bg-cyan-500 h-1.5 rounded-full" style="width: ${(allIndia.crimeRate2022 / 1424.1 * 100).toFixed(0)}%"></div>
        </div>
      `;
    }

    const kpi3 = document.getElementById('kpi-chargesheet-rate');
    if (kpi3) {
      kpi3.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Chargesheeting Efficiency</p>
            <h3 class="text-3xl font-extrabold text-emerald-400 mt-1 font-mono-numbers">${allIndia.chargesheetingRate2022}%</h3>
          </div>
          <span class="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </span>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs">
          <span class="text-emerald-400 font-medium">Top: Kerala (96.0%)</span>
          <span class="text-rose-400 font-medium">Lag: Manipur (10.4%)</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${allIndia.chargesheetingRate2022}%"></div>
        </div>
      `;
    }

    const kpi4 = document.getElementById('kpi-population');
    if (kpi4) {
      kpi4.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Tracked Population</p>
            <h3 class="text-3xl font-extrabold text-white mt-1 font-mono-numbers">1.38 <span class="text-sm font-normal text-slate-400">Billion</span></h3>
          </div>
          <span class="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </span>
        </div>
        <div class="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>28 States: <strong class="text-slate-200">97.1%</strong></span>
          <span>8 UTs: <strong class="text-slate-200">2.9%</strong></span>
        </div>
        <p class="text-[11px] text-slate-400 mt-2 font-mono-numbers">13,797.5 Lakhs Mid-Year Projected 2022</p>
      `;
    }
  }

  // Render Map Legend based on active metric
  function renderMapLegend() {
    const legendEl = document.getElementById('map-legend');
    if (!legendEl) return;

    const metric = METRICS[state.activeMetric];
    let gradientStyle = '';
    let leftLabel = '';
    let rightLabel = '';

    if (metric.higherIsBetter === false) {
      gradientStyle = 'linear-gradient(to right, #10b981, #06b6d4, #f59e0b, #ef4444, #b91c1c)';
      leftLabel = `Low (${metric.format(metric.min)}) [Lower Incidence]`;
      rightLabel = `High (${metric.format(metric.max)}) [Elevated Crime]`;
    } else if (metric.higherIsBetter === true) {
      gradientStyle = 'linear-gradient(to right, #ef4444, #f59e0b, #06b6d4, #10b981)';
      leftLabel = `Low (${metric.format(metric.min)}) [Lagging]`;
      rightLabel = `High (${metric.format(metric.max)}) [Efficient]`;
    } else {
      gradientStyle = 'linear-gradient(to right, #0284c7, #3b82f6, #6366f1, #8b5cf6)';
      leftLabel = `Low (${metric.format(metric.min)})`;
      rightLabel = `High (${metric.format(metric.max)})`;
    }

    legendEl.innerHTML = `
      <div class="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1.5">
        <span>${leftLabel}</span>
        ${metric.benchmark !== null ? `<span class="text-indigo-400 font-mono-numbers">${metric.benchmarkLabel}</span>` : `<span class="text-slate-400 font-mono-numbers">Metric: ${metric.label} (${state.activeYear})</span>`}
        <span>${rightLabel}</span>
      </div>
      <div class="w-full h-2 rounded-full" style="background: ${gradientStyle}; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);"></div>
    `;
  }

  // =========================================================================
  // MAP RENDERING CONTROLLER
  // =========================================================================
  function renderActiveView() {
    const container = document.getElementById('map-container');
    if (!container) return;

    if (state.activeViewMode === 'geo') {
      renderInteractiveGeoMap(container);
    } else if (state.activeViewMode === 'cartogram') {
      renderCartogram(container);
    } else if (state.activeViewMode === 'ranking') {
      renderRankedMatrix(container);
    }
  }

  // 1. FULL INTERACTIVE VECTOR MAP OF INDIA
  function renderInteractiveGeoMap(container) {
    if (!state.mapPaths) {
      container.innerHTML = '<div class="p-8 text-center text-slate-400">Loading vector map paths...</div>';
      return;
    }

    const metricConfig = METRICS[state.activeMetric];
    const ncrbMap = {};
    state.data.entities.forEach(e => { ncrbMap[e.name] = e; });

    let svgPathsHtml = '';
    let bubblesHtml = '';
    let labelsHtml = '';

    state.mapPaths.forEach(pathObj => {
      const item = ncrbMap[pathObj.name];
      if (!item) return;

      const val = metricConfig.getVal(item, state.activeYear);
      const color = getMetricColor(val, state.activeMetric);
      
      const isSelected = state.selectedState && state.selectedState.name === item.name;
      const isDimmed = state.filterRegion !== 'ALL' && item.region !== state.filterRegion;

      // State boundary path
      svgPathsHtml += `
        <path 
          id="map-path-${pathObj.id}"
          d="${pathObj.d}" 
          fill="${color}" 
          class="state-boundary ${isSelected ? 'active-selected' : ''} ${isDimmed ? 'dimmed' : ''}"
          data-name="${item.name}"
          data-id="${pathObj.id}"
          onclick="window.NCRB.onMapStateClick('${item.name}')"
          onmouseenter="window.NCRB.onMapStateHover('${item.name}')"
          onmousemove="window.NCRB.showSnapshot(event, '${item.name}')"
          onmouseleave="window.NCRB.hideSnapshot()"
        />
      `;

      // Crime Hotspot Bubble (Proportional circle sized by crime volume in active year)
      if (state.showBubbles) {
        const crimes = item[`crimes${state.activeYear}`] || item.crimes2022;
        // radius between 4 and 42
        const radius = Math.max(5, Math.min(42, Math.sqrt(crimes) / 15));
        bubblesHtml += `
          <g class="crime-bubble-group ${isDimmed ? 'opacity-20' : ''}">
            <circle 
              cx="${pathObj.cx}" 
              cy="${pathObj.cy}" 
              r="${radius}" 
              class="crime-bubble ${crimes > 100000 ? 'pulse' : ''}"
            />
            <circle 
              cx="${pathObj.cx}" 
              cy="${pathObj.cy}" 
              r="2.5" 
              fill="#ffffff"
            />
          </g>
        `;
      }

      // State Code Label
      if (state.showLabels) {
        labelsHtml += `
          <text 
            x="${pathObj.cx}" 
            y="${pathObj.cy + (state.showBubbles ? 12 : 3)}" 
            class="state-label ${isDimmed ? 'opacity-20' : ''}"
          >
            ${item.code}
          </text>
        `;
      }
    });

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        
        <!-- Vector Map Canvas (8 Columns on desktop) -->
        <div class="lg:col-span-8 relative">
          
          <!-- Floating Map Canvas Controls -->
          <div class="map-floating-controls">
            <button onclick="window.NCRB.zoomIn()" class="map-control-btn" title="Zoom In">+</button>
            <button onclick="window.NCRB.zoomOut()" class="map-control-btn" title="Zoom Out">&minus;</button>
            <button onclick="window.NCRB.resetZoom()" class="map-control-btn text-xs" title="Reset Map View">⟲</button>
          </div>

          <!-- Viewport with Pan & Zoom -->
          <div id="map-viewport" class="map-viewport">
            <svg 
              id="map-svg-element"
              viewBox="0 0 1000 1000" 
              class="map-svg-root"
            >
              <!-- Ambient Grid & Coordinates Pattern -->
              <defs>
                <pattern id="gridPattern" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
                </pattern>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect width="1000" height="1000" fill="url(#gridPattern)" />

              <!-- Zoom/Pan Container Group -->
              <g id="map-pan-group">
                <!-- State Boundaries -->
                <g id="map-paths-group">${svgPathsHtml}</g>
                <!-- Crime Hotspot Bubbles -->
                <g id="map-bubbles-group">${bubblesHtml}</g>
                <!-- Labels -->
                <g id="map-labels-group">${labelsHtml}</g>
              </g>
            </svg>
          </div>

          <!-- Time-Lapse & Map Layers Quick Controls Footer -->
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            
            <!-- Time-Lapse Player -->
            <div class="flex items-center gap-2">
              <button 
                id="btn-timelapse" 
                onclick="window.NCRB.toggleTimeLapse()"
                class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span id="timelapse-icon">▶</span>
                <span id="timelapse-text">Play Time-Lapse</span>
              </button>

              <div class="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button onclick="window.NCRB.setYear(2020)" class="px-2.5 py-1 rounded text-xs font-bold ${state.activeYear === 2020 ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}">2020</button>
                <button onclick="window.NCRB.setYear(2021)" class="px-2.5 py-1 rounded text-xs font-bold ${state.activeYear === 2021 ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}">2021</button>
                <button onclick="window.NCRB.setYear(2022)" class="px-2.5 py-1 rounded text-xs font-bold ${state.activeYear === 2022 ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}">2022</button>
              </div>
            </div>

            <!-- Layer Switches -->
            <div class="flex items-center gap-4 text-slate-300">
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  id="chk-show-bubbles" 
                  ${state.showBubbles ? 'checked' : ''} 
                  onchange="window.NCRB.toggleBubbles(this.checked)"
                  class="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                >
                <span>Hotspot Bubbles</span>
              </label>

              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  id="chk-show-labels" 
                  ${state.showLabels ? 'checked' : ''} 
                  onchange="window.NCRB.toggleLabels(this.checked)"
                  class="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
                >
                <span>State Codes</span>
              </label>
            </div>

            <div class="text-[11px] text-slate-400 hidden sm:block">
              Click & drag to pan &bull; Scroll to zoom
            </div>
          </div>
        </div>

        <!-- Live State Crime Inspector (4 Columns on desktop) -->
        <div class="lg:col-span-4" id="live-state-inspector"></div>

      </div>
    `;

    setupMapZoomPan();
    updateMapTransform();
  }

  // Zoom and Pan Handlers
  function setupMapZoomPan() {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;

    viewport.addEventListener('mousedown', (e) => {
      // Ignore if clicking on a path directly
      if (e.target.tagName.toLowerCase() === 'path') return;
      state.isPanning = true;
      state.panStart = { x: e.clientX - state.mapTransform.x, y: e.clientY - state.mapTransform.y };
      viewport.classList.add('panning');
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isPanning) return;
      state.mapTransform.x = e.clientX - state.panStart.x;
      state.mapTransform.y = e.clientY - state.panStart.y;
      updateMapTransform();
    });

    window.addEventListener('mouseup', () => {
      if (state.isPanning) {
        state.isPanning = false;
        viewport.classList.remove('panning');
      }
    });

    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      const newScale = Math.max(0.7, Math.min(4.5, state.mapTransform.scale * zoomFactor));
      state.mapTransform.scale = newScale;
      updateMapTransform();
    }, { passive: false });
  }

  function updateMapTransform() {
    const group = document.getElementById('map-pan-group');
    if (!group) return;
    group.setAttribute('transform', `translate(${state.mapTransform.x}, ${state.mapTransform.y}) scale(${state.mapTransform.scale})`);
  }

  function zoomIn() {
    state.mapTransform.scale = Math.min(4.5, state.mapTransform.scale * 1.25);
    updateMapTransform();
  }

  function zoomOut() {
    state.mapTransform.scale = Math.max(0.7, state.mapTransform.scale * 0.8);
    updateMapTransform();
  }

  function resetZoom() {
    state.mapTransform = { x: 0, y: 0, scale: 1 };
    updateMapTransform();
  }

  // Live State Crime Inspector Side Panel
  function updateLiveInspector(stateName) {
    const container = document.getElementById('live-state-inspector');
    if (!container) return;

    const item = state.data.entities.find(e => e.name === stateName);
    if (!item) return;

    state.hoveredState = item;
    const crimesThisYear = item[`crimes${state.activeYear}`] || item.crimes2022;
    const crimesDelta2020 = (((item.crimes2022 - item.crimes2020) / item.crimes2020) * 100).toFixed(1);

    const color = getMetricColor(crimesThisYear, 'crimesYear');

    container.innerHTML = `
      <div class="glass-card p-5 border-l-4" style="border-left-color: ${color};">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-xs font-black text-white" style="background-color: ${color};">${item.code}</span>
              <h4 class="text-xl font-black text-white">${item.name}</h4>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">${item.type} &bull; ${item.region} Region</p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold border" style="background-color: ${item.quadrantColor}20; color: ${item.quadrantColor}; border-color: ${item.quadrantColor}40">
            ${item.quadrantCode}
          </span>
        </div>

        <div class="mb-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">Crimes in ${state.activeYear}</span>
          <div class="text-3xl font-black text-white font-mono-numbers mt-0.5">${crimesThisYear.toLocaleString()}</div>
          <span class="text-xs text-slate-400">Total Cognizable IPC Crimes registered</span>
        </div>

        <!-- 3-Year Trajectory Mini Bar Chart -->
        <div class="mb-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">3-Year Crime Shift (2020 ➔ 2022)</span>
          <div class="space-y-1.5 text-xs font-mono-numbers">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">2020:</span>
              <span class="text-slate-200 font-bold">${item.crimes2020.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">2021:</span>
              <span class="text-slate-200 font-bold">${item.crimes2021.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">2022:</span>
              <span class="text-slate-200 font-bold">${item.crimes2022.toLocaleString()}</span>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-800 flex justify-between text-xs">
            <span class="text-slate-400">Net 3-Yr Change:</span>
            <span class="font-bold font-mono-numbers ${item.growth2020to2022 > 0 ? 'text-rose-400' : 'text-emerald-400'}">
              ${item.growth2020to2022 > 0 ? '+' : ''}${item.growth2020to2022}%
            </span>
          </div>
        </div>

        <!-- Key Crime Benchmarks -->
        <div class="space-y-2 text-xs mb-5">
          <div class="flex justify-between py-1 border-b border-slate-800">
            <span class="text-slate-400">Crime Rate (2022):</span>
            <span class="font-mono-numbers font-bold text-cyan-400">${item.crimeRate2022} / 100k <span class="text-slate-400 font-normal">(#${item.crimeRateRank})</span></span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-800">
            <span class="text-slate-400">Chargesheeting Rate:</span>
            <span class="font-mono-numbers font-bold text-emerald-400">${item.chargesheetingRate2022}% <span class="text-slate-400 font-normal">(#${item.chargesheetingRank})</span></span>
          </div>
          <div class="flex justify-between py-1 border-b border-slate-800">
            <span class="text-slate-400">Mid-Year Pop (2022):</span>
            <span class="font-mono-numbers text-slate-200">${item.populationLakhs2022} Lakhs</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-400">Policing Quadrant:</span>
            <span class="font-bold text-slate-200 text-right">${item.quadrant}</span>
          </div>
        </div>

        <button 
          onclick="window.NCRB.openStateDrawer('${item.name}')"
          class="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
        >
          <span>Open Full State Intelligence Dossier</span>
          <span>&rarr;</span>
        </button>

      </div>
    `;
  }

  function onMapStateClick(stateName) {
    state.selectedState = state.data.entities.find(e => e.name === stateName);
    updateLiveInspector(stateName);
    openStateDrawer(stateName);
  }

  function onMapStateHover(stateName) {
    updateLiveInspector(stateName);
  }

  // Time-Lapse Player
  function setYear(year) {
    state.activeYear = year;
    renderMapLegend();
    renderActiveView();
  }

  function toggleTimeLapse() {
    if (state.isTimeLapsePlaying) {
      stopTimeLapse();
    } else {
      startTimeLapse();
    }
  }

  function startTimeLapse() {
    state.isTimeLapsePlaying = true;
    const btnText = document.getElementById('timelapse-text');
    const btnIcon = document.getElementById('timelapse-icon');
    if (btnText) btnText.innerText = 'Pause Time-Lapse';
    if (btnIcon) btnIcon.innerText = '⏸';

    const years = [2020, 2021, 2022];
    let idx = years.indexOf(state.activeYear);

    state.timeLapseTimer = setInterval(() => {
      idx = (idx + 1) % years.length;
      setYear(years[idx]);
    }, 1800);
  }

  function stopTimeLapse() {
    state.isTimeLapsePlaying = false;
    if (state.timeLapseTimer) clearInterval(state.timeLapseTimer);
    const btnText = document.getElementById('timelapse-text');
    const btnIcon = document.getElementById('timelapse-icon');
    if (btnText) btnText.innerText = 'Play Time-Lapse';
    if (btnIcon) btnIcon.innerText = '▶';
  }

  function toggleBubbles(checked) {
    state.showBubbles = checked;
    renderActiveView();
  }

  function toggleLabels(checked) {
    state.showLabels = checked;
    renderActiveView();
  }

  function filterRegion(regionName) {
    state.filterRegion = regionName;
    renderActiveView();
  }

  // 2. Equal-Area Cartogram Grid (9x9)
  function renderCartogram(container) {
    const metricConfig = METRICS[state.activeMetric];

    let html = `
      <div class="flex flex-col items-center w-full">
        <div class="text-xs text-slate-400 mb-3 flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Equal-Area Cartogram: Uniform visual presence for all 36 jurisdictions. Click any tile to inspect dossier.</span>
        </div>
        <div class="cartogram-grid">
    `;

    const gridMap = {};
    state.data.entities.forEach(item => {
      const key = `${item.gridCoord[0]}_${item.gridCoord[1]}`;
      gridMap[key] = item;
    });

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const key = `${r}_${c}`;
        const item = gridMap[key];

        if (item) {
          const val = metricConfig.getVal(item, state.activeYear);
          const color = getMetricColor(val, state.activeMetric);
          const isSelected = state.selectedState && state.selectedState.name === item.name;

          html += `
            <div 
              class="cartogram-tile ${isSelected ? 'selected' : ''}" 
              style="background-color: ${color};"
              data-name="${item.name}"
              data-code="${item.code}"
              onclick="window.NCRB.openStateDrawer('${item.name}')"
              onmouseenter="window.NCRB.showSnapshot(event, '${item.name}')"
              onmouseleave="window.NCRB.hideSnapshot()"
            >
              <span class="text-[13px] font-black text-white leading-tight">${item.code}</span>
              <span class="text-[9px] font-mono-numbers font-medium text-white/90 leading-none mt-0.5">${metricConfig.format(val)}</span>
            </div>
          `;
        } else {
          html += `<div class="cartogram-tile cartogram-empty"></div>`;
        }
      }
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 3. Ranked Matrix List View
  function renderRankedMatrix(container) {
    const metricConfig = METRICS[state.activeMetric];

    const sorted = [...state.data.entities].sort((a, b) => {
      const va = metricConfig.getVal(a, state.activeYear);
      const vb = metricConfig.getVal(b, state.activeYear);
      return vb - va;
    });

    let html = `
      <div class="max-h-[560px] overflow-y-auto pr-2 space-y-2 w-full">
    `;

    sorted.forEach((item, idx) => {
      const val = metricConfig.getVal(item, state.activeYear);
      const color = getMetricColor(val, state.activeMetric);
      const pct = Math.max(4, Math.min(100, ((val - metricConfig.min) / (metricConfig.max - metricConfig.min)) * 100));

      html += `
        <div 
          class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between"
          onclick="window.NCRB.openStateDrawer('${item.name}')"
          onmouseenter="window.NCRB.showSnapshot(event, '${item.name}')"
          onmouseleave="window.NCRB.hideSnapshot()"
        >
          <div class="flex items-center gap-3 w-1/3 min-w-[140px]">
            <span class="w-6 text-center text-xs font-mono-numbers text-slate-400 font-bold">#${idx + 1}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40">${item.code}</span>
            <span class="text-sm font-semibold text-slate-200 truncate">${item.name}</span>
          </div>
          
          <div class="w-1/2 px-4">
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${color};"></div>
            </div>
          </div>

          <div class="w-1/6 text-right font-mono-numbers font-bold text-sm text-slate-100">
            ${metricConfig.format(val)}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  // Floating Snapshot Tooltip on Mouse Enter
  function showSnapshot(event, stateName) {
    const item = state.data.entities.find(e => e.name === stateName);
    if (!item) return;

    const card = document.getElementById('snapshot-card');
    if (!card) return;

    const metric = METRICS[state.activeMetric];
    const val = metric.getVal(item, state.activeYear);
    const color = getMetricColor(val, state.activeMetric);

    card.innerHTML = `
      <div class="p-3.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md w-72 text-left">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-xs font-bold text-white" style="background-color: ${color};">${item.code}</span>
            <h4 class="font-bold text-sm text-white truncate max-w-[150px]">${item.name}</h4>
          </div>
          <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">${item.type}</span>
        </div>

        <div class="space-y-1.5 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-400 font-medium">${metric.shortLabel} (${state.activeYear}):</span>
            <span class="font-mono-numbers font-bold text-sm text-white">${metric.format(val)}</span>
          </div>
          <div class="flex justify-between items-center text-slate-400">
            <span>Rank in India:</span>
            <span class="font-mono-numbers text-slate-200">#${item.crimeRateRank} (Rate) / #${item.chargesheetingRank} (Efficiency)</span>
          </div>
          <div class="flex justify-between items-center text-slate-400">
            <span>2022 Total IPC Crimes:</span>
            <span class="font-mono-numbers text-slate-200">${item.crimes2022.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center text-slate-400">
            <span>Chargesheeting Rate:</span>
            <span class="font-mono-numbers text-emerald-400 font-semibold">${item.chargesheetingRate2022}%</span>
          </div>
          <div class="flex justify-between items-center text-slate-400">
            <span>Mid-Year Population:</span>
            <span class="font-mono-numbers text-slate-200">${item.populationLakhs2022} Lakhs</span>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${item.quadrantColor};"></span>
            ${item.quadrant}
          </span>
          <span class="text-indigo-400 font-semibold">Click to open dossier &rarr;</span>
        </div>
      </div>
    `;

    const x = event.clientX + 16;
    const y = event.clientY + 16;

    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 200;

    card.style.left = `${Math.min(x, maxX)}px`;
    card.style.top = `${Math.min(y, maxY)}px`;
    card.classList.add('visible');
  }

  function hideSnapshot() {
    const card = document.getElementById('snapshot-card');
    if (card) card.classList.remove('visible');
  }

  // --------------------------------------------------------------------------
  // CHART STUDIO (Powered by Chart.js)
  // --------------------------------------------------------------------------
  function renderCharts() {
    initTrendChart();
    initQuadrantChart();
    initDisparityChart();
    initRegionalChart();
    initRatesChart();
  }

  // Chart 1: 3-Year Trajectory of Top States (2020 vs 2021 vs 2022)
  function initTrendChart() {
    const ctx = document.getElementById('chart-trend');
    if (!ctx) return;

    if (state.charts.trend) state.charts.trend.destroy();

    const topStates = [...state.data.entities]
      .sort((a, b) => b.crimes2022 - a.crimes2022)
      .slice(0, 8);

    const labels = topStates.map(s => s.name);
    const data2020 = topStates.map(s => s.crimes2020);
    const data2021 = topStates.map(s => s.crimes2021);
    const data2022 = topStates.map(s => s.crimes2022);

    state.charts.trend = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '2020 Crimes',
            data: data2020,
            backgroundColor: 'rgba(99, 102, 241, 0.4)',
            borderColor: '#6366f1',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: '2021 Crimes',
            data: data2021,
            backgroundColor: 'rgba(6, 182, 212, 0.5)',
            borderColor: '#06b6d4',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: '2022 Crimes',
            data: data2022,
            backgroundColor: 'rgba(244, 63, 94, 0.7)',
            borderColor: '#f43f5e',
            borderWidth: 1.5,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} crimes`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: (val) => `${(val / 1000).toFixed(0)}k`
            }
          }
        }
      }
    });
  }

  // Chart 2: Policing Efficiency Quadrant Matrix (Scatter Chart)
  function initQuadrantChart() {
    const ctx = document.getElementById('chart-quadrant');
    if (!ctx) return;

    if (state.charts.quadrant) state.charts.quadrant.destroy();

    const scatterData = state.data.entities.map(itm => ({
      x: itm.crimeRate2022,
      y: itm.chargesheetingRate2022,
      name: itm.name,
      code: itm.code,
      crimes: itm.crimes2022,
      quadrant: itm.quadrant,
      color: itm.quadrantColor
    }));

    state.charts.quadrant = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'States & UTs',
          data: scatterData,
          backgroundColor: scatterData.map(d => d.color),
          borderColor: '#ffffff',
          borderWidth: 1,
          pointRadius: scatterData.map(d => Math.max(5, Math.min(16, Math.sqrt(d.crimes) / 45))),
          pointHoverRadius: 18
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pt = ctx.raw;
                return [
                  `${pt.name} (${pt.code})`,
                  `Crime Rate: ${pt.x} per 100k`,
                  `Chargesheeting: ${pt.y}%`,
                  `2022 Total Crimes: ${pt.crimes.toLocaleString()}`,
                  `Quadrant: ${pt.quadrant}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Crime Rate per 100,000 Population (IPC)', color: '#94a3b8' },
            grid: {
              color: (ctx) => (Math.abs(ctx.tick.value - 258) < 30 ? 'rgba(99, 102, 241, 0.7)' : 'rgba(51, 65, 85, 0.25)'),
              lineWidth: (ctx) => (Math.abs(ctx.tick.value - 258) < 30 ? 2 : 1)
            },
            ticks: { color: '#94a3b8' }
          },
          y: {
            title: { display: true, text: 'Chargesheeting Rate (%)', color: '#94a3b8' },
            min: 0,
            max: 105,
            grid: {
              color: (ctx) => (Math.abs(ctx.tick.value - 71.3) < 5 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(51, 65, 85, 0.25)'),
              lineWidth: (ctx) => (Math.abs(ctx.tick.value - 71.3) < 5 ? 2 : 1)
            },
            ticks: {
              color: '#94a3b8',
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }

  // Chart 3: States vs UTs Disparity Breakdown
  function initDisparityChart() {
    const ctx = document.getElementById('chart-disparity');
    if (!ctx) return;

    if (state.charts.disparity) state.charts.disparity.destroy();

    const stSummary = state.data.summary.statesTotal;
    const utSummary = state.data.summary.utsTotal;

    state.charts.disparity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Crime Rate (per 100k)', 'Chargesheeting Rate (%)', 'Pop Share (% of India)'],
        datasets: [
          {
            label: '28 States',
            data: [
              stSummary.crimeRate2022,
              stSummary.chargesheetingRate2022,
              97.1
            ],
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: '#6366f1',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: '8 Union Territories',
            data: [
              utSummary.crimeRate2022,
              utSummary.chargesheetingRate2022,
              2.9
            ],
            backgroundColor: 'rgba(244, 63, 94, 0.7)',
            borderColor: '#f43f5e',
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    });
  }

  // Chart 4: Regional Analysis (Radar)
  function initRegionalChart() {
    const ctx = document.getElementById('chart-regional');
    if (!ctx) return;

    if (state.charts.regional) state.charts.regional.destroy();

    const regions = state.data.regions;
    const regNames = Object.keys(regions);
    const regCrimeRates = regNames.map(r => regions[r].crimeRate);
    const regChargesheet = regNames.map(r => regions[r].avgChargesheetingRate);

    state.charts.regional = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: regNames,
        datasets: [
          {
            label: 'Crime Rate (/100k)',
            data: regCrimeRates,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.2)',
            borderWidth: 2,
            pointBackgroundColor: '#06b6d4'
          },
          {
            label: 'Avg Chargesheet Rate (%)',
            data: regChargesheet,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            pointBackgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(51, 65, 85, 0.5)' },
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            pointLabels: { color: '#cbd5e1', font: { size: 11, weight: 'bold' } },
            ticks: { backdropColor: 'transparent', color: '#94a3b8', font: { size: 9 } }
          }
        }
      }
    });
  }

  // Chart 5: Top 5 Highest vs 5 Lowest Crime Rates
  function initRatesChart() {
    const ctx = document.getElementById('chart-rates');
    if (!ctx) return;

    if (state.charts.rates) state.charts.rates.destroy();

    const high5 = state.data.analytics.top5HighCrimeRate;
    const low5 = state.data.analytics.top5LowestCrimeRate.slice().reverse();

    const combined = [...high5, ...low5];
    const labels = combined.map(e => e.name);
    const rates = combined.map(e => e.crimeRate2022);
    const colors = combined.map((e, i) => (i < 5 ? '#ef4444' : '#10b981'));

    state.charts.rates = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Crime Rate (IPC per 100k)',
          data: rates,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Crime Rate: ${ctx.raw} per 100k`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#cbd5e1', font: { size: 10 } }
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // COMPARISON STUDIO
  // --------------------------------------------------------------------------
  function populateDropdowns() {
    const selects = [
      document.getElementById('compare-select-1'),
      document.getElementById('compare-select-2'),
      document.getElementById('compare-select-3')
    ];

    selects.forEach((sel, idx) => {
      if (!sel) return;
      sel.innerHTML = state.data.entities.map(e => `
        <option value="${e.name}" ${e.name === state.compareStates[idx] ? 'selected' : ''}>
          ${e.name} (${e.code})
        </option>
      `).join('');

      sel.addEventListener('change', (e) => {
        state.compareStates[idx] = e.target.value;
        renderComparisonStudio();
      });
    });
  }

  function renderComparisonStudio() {
    const container = document.getElementById('comparison-content');
    if (!container) return;

    const s1 = state.data.entities.find(e => e.name === state.compareStates[0]);
    const s2 = state.data.entities.find(e => e.name === state.compareStates[1]);
    const s3 = state.data.entities.find(e => e.name === state.compareStates[2]);

    if (!s1 || !s2 || !s3) return;

    const compared = [s1, s2, s3];

    let html = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    `;

    compared.forEach((item, idx) => {
      const colors = ['border-indigo-500', 'border-cyan-500', 'border-rose-500'];
      const textColors = ['text-indigo-400', 'text-cyan-400', 'text-rose-400'];

      html += `
        <div class="p-4 rounded-xl bg-slate-900/80 border ${colors[idx]} shadow-lg relative overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div>
              <span class="text-xs uppercase font-bold ${textColors[idx]}">Entity ${idx + 1}</span>
              <h4 class="text-lg font-bold text-white">${item.name}</h4>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">${item.code}</span>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">2022 Total IPC Crimes</span>
              <span class="font-mono-numbers font-bold text-slate-100">${item.crimes2022.toLocaleString()}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Crime Rate per 100k</span>
              <span class="font-mono-numbers font-bold text-cyan-400">${item.crimeRate2022}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Chargesheeting Rate</span>
              <span class="font-mono-numbers font-bold text-emerald-400">${item.chargesheetingRate2022}%</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">3-Year Trend (2020-22)</span>
              <span class="font-mono-numbers font-bold ${item.growth2020to2022 > 0 ? 'text-rose-400' : 'text-emerald-400'}">${item.growth2020to2022 > 0 ? '+' : ''}${item.growth2020to2022}%</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Mid-Year Pop (2022)</span>
              <span class="font-mono-numbers font-medium text-slate-300">${item.populationLakhs2022} Lakhs</span>
            </div>
          </div>

          <button 
            onclick="window.NCRB.openStateDrawer('${item.name}')" 
            class="w-full mt-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Inspect Detailed Dossier &rarr;
          </button>
        </div>
      `;
    });

    html += `
      </div>
      
      <!-- Comparison Radar Canvas -->
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <h4 class="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Multi-Metric Head-to-Head Radar</h4>
        <div class="h-64">
          <canvas id="chart-compare-radar"></canvas>
        </div>
      </div>
    `;

    container.innerHTML = html;

    renderCompareRadar(s1, s2, s3);
  }

  function renderCompareRadar(s1, s2, s3) {
    const ctx = document.getElementById('chart-compare-radar');
    if (!ctx) return;

    if (state.charts.compareRadar) state.charts.compareRadar.destroy();

    const norm = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

    state.charts.compareRadar = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Crime Rate', 'Chargesheeting Rate', '2022 Volume', '3-Yr Trend', 'Population'],
        datasets: [
          {
            label: s1.name,
            data: [
              norm(s1.crimeRate2022, 45, 1424),
              norm(s1.chargesheetingRate2022, 10, 96),
              norm(s1.crimes2022, 64, 401787),
              norm(s1.growth2020to2022, -80, 170),
              norm(s1.populationLakhs2022, 0.7, 2340)
            ],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            borderWidth: 2
          },
          {
            label: s2.name,
            data: [
              norm(s2.crimeRate2022, 45, 1424),
              norm(s2.chargesheetingRate2022, 10, 96),
              norm(s2.crimes2022, 64, 401787),
              norm(s2.growth2020to2022, -80, 170),
              norm(s2.populationLakhs2022, 0.7, 2340)
            ],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.25)',
            borderWidth: 2
          },
          {
            label: s3.name,
            data: [
              norm(s3.crimeRate2022, 45, 1424),
              norm(s3.chargesheetingRate2022, 10, 96),
              norm(s3.crimes2022, 64, 401787),
              norm(s3.growth2020to2022, -80, 170),
              norm(s3.populationLakhs2022, 0.7, 2340)
            ],
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.25)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8' } }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(51, 65, 85, 0.5)' },
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            pointLabels: { color: '#cbd5e1', font: { size: 10, weight: 'bold' } },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // INTERACTIVE DATA EXPLORER & TABLE
  // --------------------------------------------------------------------------
  function renderDataTable() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;

    let items = [...state.data.entities];

    if (state.filterType !== 'ALL') {
      items = items.filter(e => e.type === state.filterType);
    }

    if (state.filterQuadrant !== 'ALL') {
      items = items.filter(e => e.quadrantCode === state.filterQuadrant);
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(e => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.region.toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      let va = a[state.sortColumn];
      let vb = b[state.sortColumn];
      if (typeof va === 'string') {
        return state.sortDirection === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return state.sortDirection === 'asc' ? va - vb : vb - va;
    });

    const countEl = document.getElementById('table-count');
    if (countEl) countEl.innerText = `Showing ${items.length} of ${state.data.entities.length} jurisdictions`;

    let html = '';

    items.forEach((item) => {
      const rateColor = getMetricColor(item.crimeRate2022, 'crimeRate2022');
      const csColor = getMetricColor(item.chargesheetingRate2022, 'chargesheetingRate2022');
      const isPositiveGrowth = item.growth2020to2022 > 0;

      html += `
        <tr 
          class="table-hover-row border-b border-slate-800 text-xs cursor-pointer"
          onclick="window.NCRB.openStateDrawer('${item.name}')"
        >
          <td class="py-3 px-3 font-mono-numbers text-slate-400 text-center">${item.slNo}</td>
          
          <td class="py-3 px-3 font-bold text-slate-100 flex items-center gap-2">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">${item.code}</span>
            <span>${item.name}</span>
          </td>

          <td class="py-3 px-3 text-slate-400">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.type === 'State' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
              ${item.type}
            </span>
          </td>

          <td class="py-3 px-3 text-slate-400">${item.region}</td>

          <td class="py-3 px-3 font-mono-numbers font-semibold text-slate-200 text-right">${item.crimes2022.toLocaleString()}</td>
          <td class="py-3 px-3 font-mono-numbers text-slate-400 text-right">${item.crimes2021.toLocaleString()}</td>
          <td class="py-3 px-3 font-mono-numbers text-slate-400 text-right">${item.crimes2020.toLocaleString()}</td>

          <td class="py-3 px-3 font-mono-numbers text-right font-medium ${isPositiveGrowth ? 'text-rose-400' : 'text-emerald-400'}">
            ${isPositiveGrowth ? '+' : ''}${item.growth2020to2022}%
          </td>

          <td class="py-3 px-3 font-mono-numbers text-slate-300 text-right">${item.populationLakhs2022}</td>

          <td class="py-3 px-3 text-right">
            <span class="px-2 py-1 rounded text-xs font-bold font-mono-numbers" style="background-color: ${rateColor}20; color: ${rateColor}; border: 1px solid ${rateColor}40">
              ${item.crimeRate2022}
            </span>
          </td>

          <td class="py-3 px-3 text-right">
            <div class="flex items-center justify-end gap-2">
              <div class="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div class="h-1.5 rounded-full" style="width: ${item.chargesheetingRate2022}%; background-color: ${csColor}"></div>
              </div>
              <span class="font-mono-numbers font-semibold text-slate-200 w-12">${item.chargesheetingRate2022}%</span>
            </div>
          </td>

          <td class="py-3 px-3 text-center">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background-color: ${item.quadrantColor}20; color: ${item.quadrantColor}; border: 1px solid ${item.quadrantColor}40">
              ${item.quadrantCode}
            </span>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // STATE INTELLIGENCE DOSSIER (Drawer Modal)
  // --------------------------------------------------------------------------
  function openStateDrawer(stateName) {
    const item = state.data.entities.find(e => e.name === stateName);
    if (!item) return;

    state.selectedState = item;
    const drawer = document.getElementById('state-drawer');
    const content = document.getElementById('drawer-body');
    if (!drawer || !content) return;

    const natRate = state.data.analytics.nationalCrimeRate;
    const natCS = state.data.analytics.nationalChargesheetingRate;

    const rateDelta = (((item.crimeRate2022 - natRate) / natRate) * 100).toFixed(1);
    const csDelta = (item.chargesheetingRate2022 - natCS).toFixed(1);

    let grade = 'B';
    let gradeColor = 'text-amber-400';
    if (item.chargesheetingRate2022 >= 90) { grade = 'A+'; gradeColor = 'text-emerald-400'; }
    else if (item.chargesheetingRate2022 >= 80) { grade = 'A'; gradeColor = 'text-emerald-300'; }
    else if (item.chargesheetingRate2022 >= 70) { grade = 'B+'; gradeColor = 'text-cyan-400'; }
    else if (item.chargesheetingRate2022 >= 50) { grade = 'C'; gradeColor = 'text-amber-400'; }
    else { grade = 'D'; gradeColor = 'text-rose-400'; }

    content.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded text-sm font-extrabold text-white" style="background-color: ${item.quadrantColor};">${item.code}</span>
              <h2 class="text-2xl font-black text-white">${item.name}</h2>
            </div>
            <p class="text-xs text-slate-400 mt-1">${item.type} &bull; ${item.region} India &bull; Sl. No. ${item.slNo}</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold border" style="background-color: ${item.quadrantColor}20; color: ${item.quadrantColor}; border-color: ${item.quadrantColor}50">
            ${item.quadrant}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[11px] text-slate-400 font-semibold uppercase">Crime Rate (IPC)</span>
            <div class="text-2xl font-extrabold text-white mt-1 font-mono-numbers">${item.crimeRate2022}</div>
            <span class="text-[11px] font-medium ${rateDelta > 0 ? 'text-rose-400' : 'text-emerald-400'}">
              ${rateDelta > 0 ? '+' : ''}${rateDelta}% vs National Avg
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[11px] text-slate-400 font-semibold uppercase">Chargesheet Efficiency</span>
            <div class="text-2xl font-extrabold text-emerald-400 mt-1 font-mono-numbers">${item.chargesheetingRate2022}%</div>
            <span class="text-[11px] font-medium ${csDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
              ${csDelta >= 0 ? '+' : ''}${csDelta}% points vs benchmark
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[11px] text-slate-400 font-semibold uppercase">Total Crimes (2022)</span>
            <div class="text-2xl font-extrabold text-white mt-1 font-mono-numbers">${item.crimes2022.toLocaleString()}</div>
            <span class="text-[11px] text-slate-400">Rank #${item.volumeRank} in India</span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span class="text-[11px] text-slate-400 font-semibold uppercase">Investigation Grade</span>
            <div class="text-2xl font-black ${gradeColor} mt-1">${grade}</div>
            <span class="text-[11px] text-slate-400">Resolution Benchmark</span>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <h4 class="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">3-Year Crime Trajectory (2020-2022)</h4>
          <div class="h-44">
            <canvas id="drawer-trajectory-chart"></canvas>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <h4 class="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Jurisdiction Metrics Breakdown</h4>
          <div class="flex justify-between py-1.5 border-b border-slate-800">
            <span class="text-slate-400">2020 Reported Crimes:</span>
            <span class="font-mono-numbers font-bold text-slate-200">${item.crimes2020.toLocaleString()}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-800">
            <span class="text-slate-400">2021 Reported Crimes:</span>
            <span class="font-mono-numbers font-bold text-slate-200">${item.crimes2021.toLocaleString()}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-800">
            <span class="text-slate-400">2022 Reported Crimes:</span>
            <span class="font-mono-numbers font-bold text-slate-200">${item.crimes2022.toLocaleString()}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-800">
            <span class="text-slate-400">3-Year Trend (2020 to 2022):</span>
            <span class="font-mono-numbers font-bold ${item.growth2020to2022 > 0 ? 'text-rose-400' : 'text-emerald-400'}">${item.growth2020to2022 > 0 ? '+' : ''}${item.growth2020to2022}%</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-800">
            <span class="text-slate-400">1-Year YoY Trend (2021 to 2022):</span>
            <span class="font-mono-numbers font-bold ${item.growth2021to2022 > 0 ? 'text-rose-400' : 'text-emerald-400'}">${item.growth2021to2022 > 0 ? '+' : ''}${item.growth2021to2022}%</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-slate-800">
            <span class="text-slate-400">Mid-Year Population (2022):</span>
            <span class="font-mono-numbers font-bold text-slate-200">${item.populationLakhs2022} Lakhs (${(item.populationActual2022 / 1000000).toFixed(2)}M)</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-slate-400">National Crime Rate Rank:</span>
            <span class="font-mono-numbers font-bold text-cyan-400">#${item.crimeRateRank} of 36</span>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
          <strong class="font-bold text-white block mb-1">Analytical Assessment:</strong>
          ${generateCommentary(item)}
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button 
            onclick="window.print()" 
            class="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print Dossier Report
          </button>
          <button 
            onclick="window.NCRB.closeStateDrawer()" 
            class="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    `;

    drawer.classList.add('active');

    setTimeout(() => {
      const drawerCtx = document.getElementById('drawer-trajectory-chart');
      if (drawerCtx) {
        new Chart(drawerCtx, {
          type: 'line',
          data: {
            labels: ['2020', '2021', '2022'],
            datasets: [{
              label: 'Reported IPC Crimes',
              data: [item.crimes2020, item.crimes2021, item.crimes2022],
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              fill: true,
              tension: 0.35,
              pointRadius: 5,
              pointBackgroundColor: '#6366f1'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${Number(ctx.raw).toLocaleString()} crimes`
                }
              }
            },
            scales: {
              x: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#94a3b8' } },
              y: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#94a3b8' } }
            }
          }
        });
      }
    }, 100);
  }

  function closeStateDrawer() {
    const drawer = document.getElementById('state-drawer');
    if (drawer) drawer.classList.remove('active');
    state.selectedState = null;
    renderActiveView();
  }

  function generateCommentary(item) {
    if (item.name === 'Delhi') {
      return 'Delhi exhibits the highest crime rate in India (1,424.1 per 100k), over 5.5x the national average. This is primarily attributed to high registration rates, online citizen FIR facility, extensive vehicle theft reporting, and high urban density, while the chargesheeting rate remains relatively low at 30.2% due to heavy caseloads.';
    }
    if (item.name === 'Kerala') {
      return 'Kerala stands out with an exceptional chargesheeting rate of 96.0% (highest in India), demonstrating remarkable police investigation resolution speed. Its reported crime rate (661.0) reflects highly proactive crime registration protocols rather than high violent crime.';
    }
    if (item.name === 'Tamil Nadu' || item.name === 'Gujarat') {
      return `${item.name} experienced a dramatic plunge in recorded IPC crimes between 2020 and 2022 (drop of ${Math.abs(item.growth2020to2022)}%). This is directly attributable to the expiration of pandemic-era COVID-19 lockdown violation cases booked under Section 188 IPC during 2020.`;
    }
    if (item.chargesheetingRate2022 >= 85) {
      return `${item.name} maintains superior police efficiency with a chargesheeting rate of ${item.chargesheetingRate2022}%, significantly exceeding the national average of 71.3%.`;
    }
    if (item.crimeRate2022 < 100) {
      return `${item.name} ranks among India\'s lowest crime rate regions with an IPC rate of ${item.crimeRate2022} per 100k, demonstrating exceptional communal stability.`;
    }
    return `${item.name} registers ${item.crimes2022.toLocaleString()} cognizable crimes with a crime rate of ${item.crimeRate2022} per 100,000 population and chargesheeting rate of ${item.chargesheetingRate2022}%, categorized under "${item.quadrant}".`;
  }

  // --------------------------------------------------------------------------
  // EXECUTIVE INSIGHTS
  // --------------------------------------------------------------------------
  function renderInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-sm mb-3">01</div>
          <h4 class="font-bold text-white text-base mb-2">The COVID-19 Sec. 188 Lockdown Anomaly</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            National cognizable IPC crimes dropped 16.3% between 2020 (4.25M) and 2022 (3.56M). In 2020, states like Tamil Nadu (891k crimes) and Gujarat (381k) saw massive spikes due to pandemic quarantine and lockdown disobedience offenses under Section 188 IPC. By 2022, reported numbers normalized by 78.2% and 64.7% respectively.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-sm mb-3">02</div>
          <h4 class="font-bold text-white text-base mb-2">The Capital Disparity: Delhi's 1,424.1 Rate</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            Delhi records 1,424.1 crimes per 100k—5.5x the national rate (258.1). This stems from mandatory automated e-FIR registration for vehicle thefts and property crime, dense urban surveillance, and seamless public reporting, contrasted with a 30.2% chargesheeting rate caused by immense investigator case volumes.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-sm mb-3">03</div>
          <h4 class="font-bold text-white text-base mb-2">Investigation Leader: Kerala's 96.0% Resolution</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            Kerala sets India's benchmark with a 96.0% chargesheeting rate despite handling 235,858 cases (crime rate 661.0). High literacy, active police stations, and strict procedural compliance ensure virtually all registered cases reach charge-sheet status before the judiciary.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm mb-3">04</div>
          <h4 class="font-bold text-white text-base mb-2">North-Eastern Safety vs Resolution Bottlenecks</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            The North-East continues to register India's lowest crime rates: Nagaland (45.4), Sikkim (80.3), Meghalaya (87.6), and Tripura (88.7). However, chargesheeting rates vary drastically—from 10.4% in Manipur and 26.9% in Meghalaya to 73.1% in Tripura—pointing to infrastructure bottlenecks.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div class="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-sm mb-3">05</div>
          <h4 class="font-bold text-white text-base mb-2">States vs Union Territories Institutional Divide</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            India's 28 States average a 240.7 crime rate with 74.9% chargesheeting rate. In sharp contrast, Union Territories register an aggregate crime rate of 848.4 (3.5x higher) with only 35.6% chargesheeting rate, heavily influenced by Delhi's dominant urban volume.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition">
          <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm mb-3">06</div>
          <h4 class="font-bold text-white text-base mb-2">Absolute Volume vs Per-Capita Reality</h4>
          <p class="text-xs text-slate-400 leading-relaxed">
            While Uttar Pradesh (401,787) and Maharashtra (374,038) lead in raw crime totals due to their massive populations (234M and 125M), their per-capita crime rates (171.6 and 297.5) are substantially lower than mid-sized states like Kerala (661.0) and Haryana (418.6).
          </p>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // EVENT LISTENERS & CONTROLS
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Metric Selector Buttons
    const metricBtns = document.querySelectorAll('[data-metric]');
    metricBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.getAttribute('data-metric');
        if (m && METRICS[m]) {
          state.activeMetric = m;
          metricBtns.forEach(b => b.classList.remove('active', 'bg-indigo-600', 'text-white'));
          btn.classList.add('active', 'bg-indigo-600', 'text-white');
          renderMapLegend();
          renderActiveView();
        }
      });
    });

    // View Mode Switcher
    const viewBtns = document.querySelectorAll('[data-view-mode]');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vm = btn.getAttribute('data-view-mode');
        if (vm) {
          state.activeViewMode = vm;
          viewBtns.forEach(b => b.classList.remove('bg-slate-700', 'text-white'));
          btn.classList.add('bg-slate-700', 'text-white');
          renderActiveView();
        }
      });
    });

    // Region Filter Pills
    const regionBtns = document.querySelectorAll('[data-region]');
    regionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const reg = btn.getAttribute('data-region');
        state.filterRegion = reg;
        regionBtns.forEach(b => b.classList.remove('bg-cyan-500', 'text-slate-950', 'font-black'));
        btn.classList.add('bg-cyan-500', 'text-slate-950', 'font-black');
        renderActiveView();
      });
    });

    // Table Filter Buttons (Type)
    const typeBtns = document.querySelectorAll('[data-filter-type]');
    typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.filterType = btn.getAttribute('data-filter-type');
        typeBtns.forEach(b => b.classList.remove('bg-indigo-600', 'text-white'));
        btn.classList.add('bg-indigo-600', 'text-white');
        renderDataTable();
      });
    });

    // Table Quadrant Filter
    const quadSelect = document.getElementById('filter-quadrant');
    if (quadSelect) {
      quadSelect.addEventListener('change', (e) => {
        state.filterQuadrant = e.target.value;
        renderDataTable();
      });
    }

    // Table Search Input
    const tableSearch = document.getElementById('table-search-input');
    if (tableSearch) {
      tableSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderDataTable();
      });
    }

    // Table Column Sorting
    const sortHeaders = document.querySelectorAll('[data-sort]');
    sortHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (state.sortColumn === col) {
          state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColumn = col;
          state.sortDirection = 'desc';
        }
        renderDataTable();
      });
    });

    // Top Search Autocomplete
    const globalSearch = document.getElementById('global-search-input');
    const autoResults = document.getElementById('search-autocomplete');
    if (globalSearch && autoResults) {
      globalSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          autoResults.classList.add('hidden');
          return;
        }

        const matches = state.data.entities.filter(item =>
          item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query)
        ).slice(0, 5);

        if (matches.length === 0) {
          autoResults.innerHTML = '<div class="p-3 text-xs text-slate-400">No matching jurisdictions found.</div>';
          autoResults.classList.remove('hidden');
          return;
        }

        autoResults.innerHTML = matches.map(m => `
          <div 
            class="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between border-b border-slate-800 last:border-0 text-xs"
            onclick="window.NCRB.openStateDrawer('${m.name}'); document.getElementById('search-autocomplete').classList.add('hidden'); document.getElementById('global-search-input').value='';"
          >
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">${m.code}</span>
              <span class="font-bold text-slate-200">${m.name}</span>
            </div>
            <span class="text-slate-400 font-mono-numbers">Rate: ${m.crimeRate2022}</span>
          </div>
        `).join('');

        autoResults.classList.remove('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!globalSearch.contains(e.target) && !autoResults.contains(e.target)) {
          autoResults.classList.add('hidden');
        }
      });
    }

    // Export CSV Button
    const exportCsvBtn = document.getElementById('btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Export JSON Button
    const exportJsonBtn = document.getElementById('btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', exportToJSON);
    }

    // Theme Toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // Drawer close on backdrop click
    const drawerBackdrop = document.getElementById('state-drawer');
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) closeStateDrawer();
      });
    }
  }

  // Theme Toggle
  function toggleTheme() {
    state.isDark = !state.isDark;
    document.body.classList.toggle('light-theme', !state.isDark);
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = state.isDark
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
    }
  }

  // Export Table to CSV
  function exportToCSV() {
    const headers = [
      'Sl. No.', 'State/UT', 'Category', 'Region', '2020 Crimes', '2021 Crimes', '2022 Crimes',
      '3-Year Growth (%)', 'Mid-Year Population (Lakhs)', 'Rate of Cognizable Crimes (IPC) (2022)',
      'Chargesheeting Rate (2022) (%)', 'Quadrant'
    ];

    const rows = state.data.entities.map(e => [
      e.slNo,
      `"${e.name}"`,
      e.type,
      e.region,
      e.crimes2020,
      e.crimes2021,
      e.crimes2022,
      e.growth2020to2022,
      e.populationLakhs2022,
      e.crimeRate2022,
      e.chargesheetingRate2022,
      `"${e.quadrant}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'NCRB_CrimeStat_Table_1A.1_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export to JSON
  function exportToJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', 'NCRB_CrimeStat_Table_1A.1_Data.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function showErrorState(msg) {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = `
        <div class="max-w-xl mx-auto my-20 p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
          <h2 class="text-xl font-bold text-rose-400 mb-2">Error Loading Crime Analytics</h2>
          <p class="text-sm text-slate-300 mb-4">${msg}</p>
          <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold text-xs">Retry</button>
        </div>
      `;
    }
  }

  // Global Public API
  window.NCRB = {
    openStateDrawer,
    closeStateDrawer,
    showSnapshot,
    hideSnapshot,
    onMapStateClick,
    onMapStateHover,
    setYear,
    toggleTimeLapse,
    toggleBubbles,
    toggleLabels,
    filterRegion,
    zoomIn,
    zoomOut,
    resetZoom,
    exportToCSV,
    exportToJSON,
    init
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
