// map.js — OpenLayers + Crimson backend integration
// Auth is handled by session.js (apiFetch, getToken, requireAuth)
const API = 'http://127.0.0.1:8000';

requireAuth(); // redirect to login if no token

// ── Map state ─────────────────────────────────────────────────────
let map, vectorSource, vectorLayer;
let drawInteraction = null;
let activeMode = null;

// feature registry: featureId -> { dbId, layer, type }
const registry = {};

// NODE TYPE CONFIG
const NODE_TYPES = {
  router:   { label: 'Router',      icon: '⬡', color: '#58a6ff' },
  switch:   { label: 'Switch',      icon: '▣', color: '#3fb950' },
  joint:    { label: 'Муфт/Joint',  icon: '◉', color: '#d29922' },
  building: { label: 'Building',    icon: '⌂', color: '#bc8cff' },
  site:     { label: 'Site',        icon: '▲', color: '#ff7b72' },
  client:   { label: 'Client',      icon: '●', color: '#79c0ff' },
};

// CABLE TYPE CONFIG
const CABLE_TYPES = {
  fiber:    { label: 'Fiber Optic', color: '#58a6ff', dash: null },
  ftp:      { label: 'FTP Cable',   color: '#d29922', dash: [6,3] },
  backbone: { label: 'Backbone',    color: '#ff7b72', dash: [10,4] },
};

// ── Tile sources ──────────────────────────────────────────────────
const TILES = {
  dark: new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attributions: '© CARTO'
    })
  }),
  roadmap:   new ol.layer.Tile({ source: new ol.source.OSM() }),
  satellite: new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: '© Esri'
    })
  }),
  terrain: new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      attributions: '© OpenTopoMap'
    })
  }),
};

// ── Style ─────────────────────────────────────────────────────────
function makeStyle(layer, subtype, selected = false) {
  const sw = selected ? 3 : 2;
  const selFill = selected ? '44' : '22';

  if (layer === 'node') {
    const cfg = NODE_TYPES[subtype] || NODE_TYPES.client;
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: selected ? 9 : 7,
        fill: new ol.style.Fill({ color: cfg.color }),
        stroke: new ol.style.Stroke({ color: selected ? '#fff' : '#0d1117', width: sw })
      }),
      text: new ol.style.Text({
        text: cfg.icon,
        font: '11px Inter',
        fill: new ol.style.Fill({ color: '#0d1117' }),
        offsetY: 0
      })
    });
  }

  if (layer === 'cable') {
    const cfg = CABLE_TYPES[subtype] || CABLE_TYPES.fiber;
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: cfg.color,
        width: selected ? 4 : 2.5,
        lineDash: cfg.dash || undefined
      })
    });
  }

  if (layer === 'zone') {
    return new ol.style.Style({
      fill: new ol.style.Fill({ color: '#3fb950' + selFill }),
      stroke: new ol.style.Stroke({ color: '#3fb950', width: sw, lineDash: [8,4] })
    });
  }

  return new ol.style.Style();
}

// ── Init ──────────────────────────────────────────────────────────
function initMap() {
  vectorSource = new ol.source.Vector();
  vectorLayer  = new ol.layer.Vector({
    source: vectorSource,
    style: (f) => makeStyle(f.get('layer'), f.get('subtype'))
  });

  map = new ol.Map({
    target: 'map',
    layers: [TILES.dark, vectorLayer],
    view: new ol.View({
      center: ol.proj.fromLonLat([106.8832, 47.9077]),
      zoom: 13
    }),
    controls: ol.control.defaults.defaults({ attributionOptions: { collapsible: true } })
  });

  map.on('pointermove', (e) => {
    const [lng, lat] = ol.proj.toLonLat(e.coordinate);
    document.getElementById('cursor-pos').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    map.getTargetElement().style.cursor =
      map.hasFeatureAtPixel(e.pixel) && !drawInteraction ? 'pointer' : '';
  });

  // Click = select feature
  map.on('click', (e) => {
    if (drawInteraction) return;
    let hit = false;
    map.forEachFeatureAtPixel(e.pixel, (f) => {
      if (!hit) { openEditPanel(f); hit = true; }
      return true;
    });
    if (!hit) closePanel();
  });

  document.querySelector('[data-type="dark"]').classList.add('active');
  loadAll();
}

// ── Load all from backend ─────────────────────────────────────────
async function loadAll() {
  setStatus('Loading network data…');
  await Promise.all([loadNodes(), loadCables(), loadZones()]);
  setStatus(`Loaded ${vectorSource.getFeatures().length} features`);
}

async function loadNodes() {
  try {
    const res = await apiFetch(`${API}/points/`);
    if (!res || !res.ok) return;
    const data = await res.json();
    data.forEach(n => addNodeFeature(n));
    renderList();
  } catch(e) { console.error('loadNodes:', e); }
}

async function loadCables() {
  try {
    const res = await apiFetch(`${API}/cable-segments/`);
    if (!res || !res.ok) return;
    const data = await res.json();
    data.forEach(c => addCableFeature(c));
    renderList();
  } catch(e) { console.error('loadCables:', e); }
}

async function loadZones() {
  try {
    const res = await apiFetch(`${API}/coverage-zones/`);
    if (!res || !res.ok) return;
    const data = await res.json();
    data.forEach(z => addZoneFeature(z));
    renderList();
  } catch(e) { console.error('loadZones:', e); }
}

// ── Feature builders from DB records ─────────────────────────────
function wktPointToOl(wkt) {
  // "POINT(106.88 47.90)"
  const m = wkt.match(/POINT\(([^ ]+) ([^ )]+)\)/);
  if (!m) return null;
  return ol.proj.fromLonLat([parseFloat(m[1]), parseFloat(m[2])]);
}

function wktLineToOl(wkt) {
  const inner = wkt.replace(/^LINESTRING\(/, '').replace(/\)$/, '');
  return inner.split(',').map(p => {
    const [x, y] = p.trim().split(' ');
    return ol.proj.fromLonLat([parseFloat(x), parseFloat(y)]);
  });
}

function wktPolyToOl(wkt) {
  const inner = wkt.replace(/^POLYGON\(\(/, '').replace(/\)\)$/, '');
  return [inner.split(',').map(p => {
    const [x, y] = p.trim().split(' ');
    return ol.proj.fromLonLat([parseFloat(x), parseFloat(y)]);
  })];
}

function addNodeFeature(n) {
  if (!n.location) return;
  const coord = wktPointToOl(n.location);
  if (!coord) return;
  const f = new ol.Feature({ geometry: new ol.geom.Point(coord) });
  const fid = `node_${n.id}`;
  f.setId(fid);
  f.set('layer', 'node');
  f.set('subtype', n.node_type || 'client');
  f.set('dbId', n.id);
  f.set('name', n.name);
  f.set('description', n.description);
  vectorSource.addFeature(f);
  registry[fid] = { dbId: n.id, layer: 'node', subtype: n.node_type, name: n.name };
}

function addCableFeature(c) {
  if (!c.path) return;
  const coords = wktLineToOl(c.path);
  if (!coords || coords.length < 2) return;
  const f = new ol.Feature({ geometry: new ol.geom.LineString(coords) });
  const fid = `cable_${c.id}`;
  f.setId(fid);
  f.set('layer', 'cable');
  f.set('subtype', c.cable_type || 'fiber');
  f.set('dbId', c.id);
  f.set('name', c.name);
  f.set('core_count', c.core_count);
  vectorSource.addFeature(f);
  registry[fid] = { dbId: c.id, layer: 'cable', subtype: c.cable_type, name: c.name };
}

function addZoneFeature(z) {
  if (!z.area) return;
  const rings = wktPolyToOl(z.area);
  if (!rings) return;
  const f = new ol.Feature({ geometry: new ol.geom.Polygon(rings) });
  const fid = `zone_${z.id}`;
  f.setId(fid);
  f.set('layer', 'zone');
  f.set('subtype', 'zone');
  f.set('dbId', z.id);
  f.set('name', z.name);
  vectorSource.addFeature(f);
  registry[fid] = { dbId: z.id, layer: 'zone', subtype: 'zone', name: z.name };
}

// ── Draw tools ────────────────────────────────────────────────────
function setTool(mode, btn) {
  if (drawInteraction) { map.removeInteraction(drawInteraction); drawInteraction = null; }
  document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  activeMode = mode;
  closePanel();

  if (!mode) { setStatus('Pan — click a feature to edit'); return; }

  const geomMap = {
    node:  'Point',
    cable: 'LineString',
    zone:  'Polygon',
  };

  drawInteraction = new ol.interaction.Draw({
    source: vectorSource,
    type: geomMap[mode]
  });

  drawInteraction.on('drawend', async (e) => {
    const feature = e.feature;
    const geom = feature.getGeometry();
    map.removeInteraction(drawInteraction);
    drawInteraction = null;
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-mode="null"]').classList.add('active');
    activeMode = null;

    // Prompt user to fill details then save
    openCreatePanel(feature, geom, mode);
  });

  const tips = {
    node:  'Click to place a network node',
    cable: 'Click points, double-click to finish cable route',
    zone:  'Click points, double-click to close coverage zone',
  };
  setStatus(tips[mode]);
}

function setMapType(type, btn) {
  if (!map) return;
  map.getLayers().setAt(0, TILES[type]);
  document.querySelectorAll('.mt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── Sidebar panels ────────────────────────────────────────────────
let selectedFeature = null;

function closePanel() {
  if (selectedFeature) {
    selectedFeature.setStyle(undefined); // reset to layer style fn
    selectedFeature = null;
  }
  document.getElementById('panel').innerHTML = '';
  document.getElementById('panel').style.display = 'none';
}

function openEditPanel(feature) {
  selectedFeature = feature;
  const layer = feature.get('layer');
  const subtype = feature.get('subtype');
  const dbId = feature.get('dbId');
  const name = feature.get('name') || '';
  const desc = feature.get('description') || '';
  const cores = feature.get('core_count') || '';

  // highlight
  feature.setStyle(makeStyle(layer, subtype, true));

  const panel = document.getElementById('panel');
  panel.style.display = 'flex';

  if (layer === 'node') {
    panel.innerHTML = `
      <div class="panel-title">Edit Node <span class="panel-id">#${dbId}</span></div>
      <label>Name<input id="p-name" value="${escHtml(name)}"></label>
      <label>Description<input id="p-desc" value="${escHtml(desc)}"></label>
      <label>Type
        <select id="p-ntype">
          ${Object.entries(NODE_TYPES).map(([k,v]) =>
            `<option value="${k}" ${subtype===k?'selected':''}>${v.icon} ${v.label}</option>`
          ).join('')}
        </select>
      </label>
      <div class="panel-actions">
        <button class="btn-save" onclick="saveNode(${dbId})">Save</button>
        <button class="btn-del"  onclick="deleteNode(${dbId}, '${feature.getId()}')">Delete</button>
      </div>
    `;
  } else if (layer === 'cable') {
    panel.innerHTML = `
      <div class="panel-title">Edit Cable <span class="panel-id">#${dbId}</span></div>
      <label>Name<input id="p-name" value="${escHtml(name)}"></label>
      <label>Core Count<input id="p-cores" type="number" value="${cores}" placeholder="e.g. 24"></label>
      <label>Type
        <select id="p-ctype">
          ${Object.entries(CABLE_TYPES).map(([k,v]) =>
            `<option value="${k}" ${subtype===k?'selected':''}>${v.label}</option>`
          ).join('')}
        </select>
      </label>
      <div class="panel-actions">
        <button class="btn-save" onclick="saveCable(${dbId})">Save</button>
        <button class="btn-del"  onclick="deleteCable(${dbId}, '${feature.getId()}')">Delete</button>
      </div>
    `;
  } else if (layer === 'zone') {
    panel.innerHTML = `
      <div class="panel-title">Edit Zone <span class="panel-id">#${dbId}</span></div>
      <label>Name<input id="p-name" value="${escHtml(name)}"></label>
      <div class="panel-actions">
        <button class="btn-save" onclick="saveZone(${dbId})">Save</button>
        <button class="btn-del"  onclick="deleteZone(${dbId}, '${feature.getId()}')">Delete</button>
      </div>
    `;
  }
}

function openCreatePanel(feature, geom, mode) {
  const panel = document.getElementById('panel');
  panel.style.display = 'flex';

  if (mode === 'node') {
    panel.innerHTML = `
      <div class="panel-title">New Node</div>
      <label>Name<input id="p-name" placeholder="e.g. Router-01"></label>
      <label>Description<input id="p-desc" placeholder="optional"></label>
      <label>Type
        <select id="p-ntype">
          ${Object.entries(NODE_TYPES).map(([k,v]) =>
            `<option value="${k}">${v.icon} ${v.label}</option>`
          ).join('')}
        </select>
      </label>
      <div class="panel-actions">
        <button class="btn-save" onclick="createNode(this)">Add Node</button>
        <button class="btn-cancel" onclick="cancelDraw('${feature.ol_uid}')">Cancel</button>
      </div>
    `;
    panel.dataset.pendingFeature = feature.ol_uid;
    panel.dataset.pendingGeom = JSON.stringify(ol.proj.toLonLat(geom.getCoordinates()));
    panel.dataset.pendingMode = 'node';
    panel.dataset.featureRef = feature.ol_uid;
    // store feature ref globally
    window._pendingFeature = feature;

  } else if (mode === 'cable') {
    const coords = geom.getCoordinates().map(c => ol.proj.toLonLat(c));
    panel.innerHTML = `
      <div class="panel-title">New Cable</div>
      <label>Name<input id="p-name" placeholder="e.g. Fiber-BLK01"></label>
      <label>Core Count<input id="p-cores" type="number" placeholder="e.g. 24"></label>
      <label>Type
        <select id="p-ctype">
          ${Object.entries(CABLE_TYPES).map(([k,v]) =>
            `<option value="${k}">${v.label}</option>`
          ).join('')}
        </select>
      </label>
      <div class="panel-actions">
        <button class="btn-save" onclick="createCable(this)">Add Cable</button>
        <button class="btn-cancel" onclick="cancelDraw()">Cancel</button>
      </div>
    `;
    window._pendingFeature = feature;
    window._pendingCoords = coords;

  } else if (mode === 'zone') {
    const coords = geom.getCoordinates()[0].map(c => ol.proj.toLonLat(c));
    panel.innerHTML = `
      <div class="panel-title">New Zone</div>
      <label>Name<input id="p-name" placeholder="e.g. District-A"></label>
      <div class="panel-actions">
        <button class="btn-save" onclick="createZone(this)">Add Zone</button>
        <button class="btn-cancel" onclick="cancelDraw()">Cancel</button>
      </div>
    `;
    window._pendingFeature = feature;
    window._pendingCoords = coords;
  }
}

function cancelDraw() {
  if (window._pendingFeature) {
    vectorSource.removeFeature(window._pendingFeature);
    window._pendingFeature = null;
  }
  closePanel();
}

// ── Create ────────────────────────────────────────────────────────
async function createNode() {
  const name    = document.getElementById('p-name').value.trim();
  const desc    = document.getElementById('p-desc').value.trim();
  const ntype   = document.getElementById('p-ntype').value;
  const feature = window._pendingFeature;
  if (!name) { setStatus('Name required'); return; }

  const [lng, lat] = ol.proj.toLonLat(feature.getGeometry().getCoordinates());

  try {
    const res = await apiFetch(`${API}/points/`, {
      method: 'POST',
      body: JSON.stringify({ name, description: desc, node_type: ntype, longitude: lng, latitude: lat, details: null })
    });
    if (!res.ok) throw new Error(await res.text());
    const n = await res.json();

    // Replace temp feature with proper one
    vectorSource.removeFeature(feature);
    window._pendingFeature = null;
    addNodeFeature(n);
    renderList();
    closePanel();
    setStatus(`Added node: ${n.name}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

async function createCable() {
  const name   = document.getElementById('p-name').value.trim();
  const cores  = parseInt(document.getElementById('p-cores').value) || null;
  const ctype  = document.getElementById('p-ctype').value;
  const coords = window._pendingCoords;
  if (!name) { setStatus('Name required'); return; }

  const coordinates = coords.map(([lng, lat]) => ({ longitude: lng, latitude: lat }));

  try {
    const res = await apiFetch(`${API}/cable-segments/`, {
      method: 'POST',
      body: JSON.stringify({ name, core_count: cores, cable_type: ctype, coordinates, details: null })
    });
    if (!res.ok) throw new Error(await res.text());
    const c = await res.json();

    vectorSource.removeFeature(window._pendingFeature);
    window._pendingFeature = null;
    addCableFeature(c);
    renderList();
    closePanel();
    setStatus(`Added cable: ${c.name}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

async function createZone() {
  const name   = document.getElementById('p-name').value.trim();
  const coords = window._pendingCoords;
  if (!name) { setStatus('Name required'); return; }

  const coordinates = coords.map(([lng, lat]) => ({ longitude: lng, latitude: lat }));

  try {
    const res = await apiFetch(`${API}/coverage-zones/`, {
      method: 'POST',
      body: JSON.stringify({ name, coordinates, details: null })
    });
    if (!res.ok) throw new Error(await res.text());
    const z = await res.json();

    vectorSource.removeFeature(window._pendingFeature);
    window._pendingFeature = null;
    addZoneFeature(z);
    renderList();
    closePanel();
    setStatus(`Added zone: ${z.name}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

// ── Update ────────────────────────────────────────────────────────
async function saveNode(dbId) {
  const name  = document.getElementById('p-name').value.trim();
  const desc  = document.getElementById('p-desc').value.trim();
  const ntype = document.getElementById('p-ntype').value;

  // Get existing coords from feature
  const fid = `node_${dbId}`;
  const feature = vectorSource.getFeatureById(fid);
  const [lng, lat] = ol.proj.toLonLat(feature.getGeometry().getCoordinates());

  try {
    const res = await apiFetch(`${API}/points/${dbId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description: desc, node_type: ntype, longitude: lng, latitude: lat, details: null })
    });
    if (!res.ok) throw new Error(await res.text());
    const n = await res.json();

    feature.set('name', n.name);
    feature.set('subtype', n.node_type);
    feature.set('description', n.description);
    feature.setStyle(makeStyle('node', n.node_type));
    registry[fid] = { ...registry[fid], subtype: n.node_type, name: n.name };
    renderList();
    closePanel();
    setStatus(`Saved: ${n.name}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

async function saveCable(dbId) {
  const name  = document.getElementById('p-name').value.trim();
  const cores = parseInt(document.getElementById('p-cores').value) || null;
  const ctype = document.getElementById('p-ctype').value;

  const fid = `cable_${dbId}`;
  const feature = vectorSource.getFeatureById(fid);
  const coords = feature.getGeometry().getCoordinates().map(c => {
    const [lng, lat] = ol.proj.toLonLat(c);
    return { longitude: lng, latitude: lat };
  });

  try {
    const res = await apiFetch(`${API}/cable-segments/${dbId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, core_count: cores, cable_type: ctype, coordinates: coords, details: null })
    });
    if (!res.ok) throw new Error(await res.text());
    const c = await res.json();

    feature.set('name', c.name);
    feature.set('subtype', c.cable_type);
    feature.set('core_count', c.core_count);
    feature.setStyle(makeStyle('cable', c.cable_type));
    registry[fid] = { ...registry[fid], subtype: c.cable_type, name: c.name };
    renderList();
    closePanel();
    setStatus(`Saved: ${c.name}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

async function saveZone(dbId) {
  const name = document.getElementById('p-name').value.trim();

  const fid = `zone_${dbId}`;
  const feature = vectorSource.getFeatureById(fid);
  const coords = feature.getGeometry().getCoordinates()[0].map(c => {
    const [lng, lat] = ol.proj.toLonLat(c);
    return { longitude: lng, latitude: lat };
  });

  try {
    const res = await apiFetch(`${API}/coverage-zones/${dbId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, coordinates: coords, details: null })
    });
    if (!res.ok) throw new Error(await res.text());
    const z = await res.json();

    feature.set('name', z.name);
    registry[fid] = { ...registry[fid], name: z.name };
    renderList();
    closePanel();
    setStatus(`Saved: ${z.name}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

// ── Delete ────────────────────────────────────────────────────────
async function deleteNode(dbId, fid) {
  if (!confirm('Delete this node?')) return;
  try {
    const res = await apiFetch(`${API}/points/${dbId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    removeFeature(fid);
    setStatus(`Deleted node #${dbId}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

async function deleteCable(dbId, fid) {
  if (!confirm('Delete this cable segment?')) return;
  try {
    const res = await apiFetch(`${API}/cable-segments/${dbId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    removeFeature(fid);
    setStatus(`Deleted cable #${dbId}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

async function deleteZone(dbId, fid) {
  if (!confirm('Delete this zone?')) return;
  try {
    const res = await apiFetch(`${API}/coverage-zones/${dbId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    removeFeature(fid);
    setStatus(`Deleted zone #${dbId}`);
  } catch(e) { setStatus(`Error: ${e.message}`); }
}

function removeFeature(fid) {
  const f = vectorSource.getFeatureById(fid);
  if (f) vectorSource.removeFeature(f);
  delete registry[fid];
  renderList();
  closePanel();
}

// ── Sidebar list ──────────────────────────────────────────────────
function renderList() {
  const list = document.getElementById('list');
  const features = vectorSource.getFeatures();
  const cnt = features.length;
  document.getElementById('cnt').textContent = cnt;

  if (!cnt) {
    list.innerHTML = '<div class="empty-list">No features loaded.<br>Draw or load from backend.</div>';
    return;
  }

  // Group by layer
  const nodes  = features.filter(f => f.get('layer') === 'node');
  const cables = features.filter(f => f.get('layer') === 'cable');
  const zones  = features.filter(f => f.get('layer') === 'zone');

  let html = '';

  if (nodes.length) {
    html += `<div class="list-group-label">Nodes (${nodes.length})</div>`;
    nodes.forEach(f => {
      const cfg = NODE_TYPES[f.get('subtype')] || NODE_TYPES.client;
      html += `<div class="s-item" onclick="openEditPanel(vectorSource.getFeatureById('${f.getId()}'))">
        <div class="s-badge">
          <span class="s-dot" style="background:${cfg.color}"></span>
          <span>${cfg.icon} ${escHtml(f.get('name') || f.getId())}</span>
        </div>
        <div class="s-sub">${cfg.label}</div>
      </div>`;
    });
  }

  if (cables.length) {
    html += `<div class="list-group-label">Cables (${cables.length})</div>`;
    cables.forEach(f => {
      const cfg = CABLE_TYPES[f.get('subtype')] || CABLE_TYPES.fiber;
      const cores = f.get('core_count') ? ` · ${f.get('core_count')}c` : '';
      html += `<div class="s-item" onclick="openEditPanel(vectorSource.getFeatureById('${f.getId()}'))">
        <div class="s-badge">
          <span class="s-dot" style="background:${cfg.color}"></span>
          <span>${escHtml(f.get('name') || f.getId())}</span>
        </div>
        <div class="s-sub">${cfg.label}${cores}</div>
      </div>`;
    });
  }

  if (zones.length) {
    html += `<div class="list-group-label">Zones (${zones.length})</div>`;
    zones.forEach(f => {
      html += `<div class="s-item" onclick="openEditPanel(vectorSource.getFeatureById('${f.getId()}'))">
        <div class="s-badge">
          <span class="s-dot" style="background:#3fb950"></span>
          <span>⬡ ${escHtml(f.get('name') || f.getId())}</span>
        </div>
        <div class="s-sub">Coverage zone</div>
      </div>`;
    });
  }

  list.innerHTML = html;
}

// ── Helpers ───────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setStatus(msg) { document.getElementById('status').textContent = msg; }

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initMap);
