let map, dm;
let shapes = [];
let counters = {};

const COLORS = { polyline:'#58a6ff', polygon:'#3fb950', marker:'#f85149', circle:'#d29922' };

function startApp() {
  const key = document.getElementById('apikey').value.trim();
  if (!key || key.length < 20) { document.getElementById('err').style.display='block'; return; }

  window.initMap = initMap;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=drawing,geometry&callback=initMap`;
  s.async = true;
  s.onerror = () => {
    document.getElementById('err').style.display = 'block';
    document.getElementById('setup').style.display = 'flex';
    document.getElementById('app').classList.remove('on');
  };
  document.head.appendChild(s);

  document.getElementById('setup').style.display = 'none';
  document.getElementById('app').classList.add('on');
  setStatus('Loading map...');
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 47.9077, lng: 106.8832 },
    zoom: 13,
    mapTypeId: 'roadmap',
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
    styles: [
      { featureType:'water',      elementType:'geometry',          stylers:[{color:'#1c2a3a'}] },
      { featureType:'landscape',  elementType:'geometry',          stylers:[{color:'#1a1f29'}] },
      { featureType:'road',       elementType:'geometry',          stylers:[{color:'#21262d'}] },
      { featureType:'road',       elementType:'geometry.stroke',   stylers:[{color:'#30363d'}] },
      { featureType:'poi',        elementType:'geometry',          stylers:[{color:'#161b22'}] },
      { featureType:'transit',    elementType:'geometry',          stylers:[{color:'#161b22'}] },
      { featureType:'administrative', elementType:'geometry.stroke', stylers:[{color:'#30363d'}] },
      { elementType:'labels.text.fill', stylers:[{color:'#8b949e'}] },
      { elementType:'labels.text.stroke', stylers:[{color:'#0d1117'}] },
    ]
  });

  dm = new google.maps.drawing.DrawingManager({
    drawingMode: null,
    drawingControl: false,
    polylineOptions: { strokeColor: COLORS.polyline, strokeOpacity:1, strokeWeight:3, editable:true, draggable:true },
    polygonOptions:  { fillColor: COLORS.polygon, fillOpacity:.15, strokeColor: COLORS.polygon, strokeWeight:2, editable:true, draggable:true },
    markerOptions:   { draggable:true },
    circleOptions:   { fillColor: COLORS.circle, fillOpacity:.15, strokeColor: COLORS.circle, strokeWeight:2, editable:true, draggable:true }
  });
  dm.setMap(map);

  google.maps.event.addListener(dm, 'overlaycomplete', function(e) {
    counters[e.type] = (counters[e.type] || 0) + 1;
    const id = `${e.type}_${counters[e.type]}`;
    const shape = { id, type: e.type, overlay: e.overlay };
    shapes.push(shape);

    google.maps.event.addListener(e.overlay, 'click', () => selectShape(id));

    if (e.type === 'polyline' || e.type === 'polygon') {
      const path = e.overlay.getPath();
      google.maps.event.addListener(path, 'set_at',    () => refreshItem(id));
      google.maps.event.addListener(path, 'insert_at', () => refreshItem(id));
      google.maps.event.addListener(path, 'remove_at', () => refreshItem(id));
    }
    if (e.type === 'circle') {
      google.maps.event.addListener(e.overlay, 'radius_changed', () => refreshItem(id));
      google.maps.event.addListener(e.overlay, 'center_changed', () => refreshItem(id));
    }
    if (e.type === 'marker') {
      google.maps.event.addListener(e.overlay, 'dragend', () => refreshItem(id));
      // Auto-return to pan after placing marker
      setTool(null, document.querySelector('[data-mode="null"]'));
    }

    addToList(shape);
    setStatus(`Added ${id}`);
  });

  google.maps.event.addListener(map, 'mousemove', function(e) {
    document.getElementById('cursor-pos').textContent =
      `${e.latLng.lat().toFixed(5)}, ${e.latLng.lng().toFixed(5)}`;
  });

  setStatus('Map ready — select a tool above');
}

function setTool(mode, btn) {
  if (!dm) return;
  dm.setDrawingMode(mode === 'null' ? null : mode);
  document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const tips = {
    null: 'Pan mode — click shapes to select',
    polyline: 'Line: click to add points, double-click to finish',
    polygon: 'Area: click to add points, double-click to close',
    marker: 'Click map to place a pin',
    circle: 'Click and drag to draw a circle'
  };
  setStatus(tips[mode] || '');
}

function setMapType(type, btn) {
  if (!map) return;
  map.setMapTypeId(type);
  document.querySelectorAll('.mt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function coordsSummary(shape) {
  const o = shape.overlay, t = shape.type;
  if (t === 'marker') {
    const p = o.getPosition();
    return `${p.lat().toFixed(6)}, ${p.lng().toFixed(6)}`;
  }
  if (t === 'circle') {
    const c = o.getCenter();
    return `${c.lat().toFixed(5)}, ${c.lng().toFixed(5)}\nr = ${(o.getRadius()/1000).toFixed(3)} km`;
  }
  const path = o.getPath(), n = path.getLength();
  if (n === 0) return 'empty';
  let lines = [];
  for (let i = 0; i < Math.min(n, 3); i++) {
    const pt = path.getAt(i);
    lines.push(`[${pt.lat().toFixed(5)}, ${pt.lng().toFixed(5)}]`);
  }
  if (n > 3) lines.push(`  … +${n-3} more pts`);
  return lines.join('\n');
}

function fullGeometry(shape) {
  const o = shape.overlay, t = shape.type;
  if (t === 'marker') {
    const p = o.getPosition();
    return { type:'Point', coordinates:[round(p.lng()), round(p.lat())] };
  }
  if (t === 'circle') {
    const c = o.getCenter();
    return { type:'Circle', center:[round(c.lng()), round(c.lat())], radius:Math.round(o.getRadius()) };
  }
  const path = o.getPath();
  const coords = [];
  for (let i = 0; i < path.getLength(); i++) {
    const pt = path.getAt(i);
    coords.push([round(pt.lng()), round(pt.lat())]);
  }
  if (t === 'polygon' && coords.length > 0) { coords.push(coords[0]); return { type:'Polygon', coordinates:[coords] }; }
  return { type:'LineString', coordinates:coords };
}

function round(n) { return parseFloat(n.toFixed(6)); }

function addToList(shape) {
  const list = document.getElementById('list');
  const el = document.createElement('div');
  el.className = 's-item';
  el.id = `item-${shape.id}`;
  el.onclick = () => selectShape(shape.id);
  el.innerHTML = `
    <div class="s-row">
      <div class="s-badge">
        <div class="s-dot d-${shape.type === 'polyline' ? 'poly' : shape.type}"></div>
        <span>${shape.id}</span>
      </div>
      <button class="s-del" onclick="deleteShape('${shape.id}',event)" title="Delete">✕</button>
    </div>
    <div class="s-coords" id="c-${shape.id}">${coordsSummary(shape)}</div>
  `;
  list.appendChild(el);
  updateCount();
}

function refreshItem(id) {
  const shape = shapes.find(s => s.id === id);
  if (!shape) return;
  const el = document.getElementById(`c-${id}`);
  if (el) el.textContent = coordsSummary(shape);
}

function selectShape(id) {
  document.querySelectorAll('.s-item').forEach(e => e.classList.remove('sel'));
  const el = document.getElementById(`item-${id}`);
  if (el) { el.classList.add('sel'); el.scrollIntoView({ block:'nearest' }); }
}

function deleteShape(id, event) {
  if (event) event.stopPropagation();
  const idx = shapes.findIndex(s => s.id === id);
  if (idx === -1) return;
  shapes[idx].overlay.setMap(null);
  shapes.splice(idx, 1);
  const el = document.getElementById(`item-${id}`);
  if (el) el.remove();
  updateCount();
  setStatus(`Deleted ${id}`);
}

function clearAll() {
  if (shapes.length === 0) return;
  if (!confirm(`Delete all ${shapes.length} shape(s)?`)) return;
  shapes.forEach(s => s.overlay.setMap(null));
  shapes = [];
  document.getElementById('list').innerHTML = '';
  updateCount();
  setStatus('All shapes cleared');
}

function updateCount() {
  document.getElementById('cnt').textContent = shapes.length;
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

function buildGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: shapes.map(s => ({
      type: 'Feature',
      properties: { id: s.id, shapeType: s.type },
      geometry: fullGeometry(s)
    }))
  };
}

function exportGeoJSON() {
  if (shapes.length === 0) { setStatus('No shapes to export'); return; }
  const data = JSON.stringify(buildGeoJSON(), null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type:'application/json' }));
  a.download = 'drawing.geojson';
  a.click();
  setStatus(`Exported ${shapes.length} shape(s) as GeoJSON`);
}

function copyJSON() {
  if (shapes.length === 0) { setStatus('No shapes to copy'); return; }
  const data = JSON.stringify(buildGeoJSON(), null, 2);
  navigator.clipboard.writeText(data).then(() => {
    setStatus('GeoJSON copied to clipboard!');
  }).catch(() => {
    prompt('Copy this GeoJSON:', data);
  });
}