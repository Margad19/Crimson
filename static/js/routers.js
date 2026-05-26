// static/js/routers.js

let allRouters  = [];
let allDevices  = [];
let allStatuses = [];

// ── LOAD ──
async function loadRouters() {
  const tbody = document.getElementById("routers-tbody");
  tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:18px">Loading...</td></tr>`;

  try {
    [allRouters, allDevices] = await Promise.all([
      apiFetch(`${API}/routers/`).then(r => r.json()),
      apiFetch(`${API}/devices/`).then(r => r.json()),
    ]);

    renderRoutersTable(allRouters, allDevices, []);
    syncTerminalDropdown(allRouters);

    // ping statuses after — slow
    apiFetch(`${API}/routers/status`)
      .then(r => r.json())
      .then(statuses => {
        allStatuses = statuses;
        renderRoutersTable(allRouters, allDevices, allStatuses);
      });

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red);text-align:center;padding:18px">Failed to load routers</td></tr>`;
    console.error(err);
  }
}
// after loadRouters populates allRouters, sync terminal dropdown
function syncTerminalDropdown(routers) {
  const sel = document.getElementById("term-router-select");
  sel.innerHTML = routers.map(r =>
    `<option value="${r.id}">${r.name}</option>`
  ).join("");
}
// ── RENDER TABLE ──
function renderRoutersTable(routers, devices, statuses) {
  const deviceMap = Object.fromEntries(devices.map(d => [d.id, d.name]));
  const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.online]));
  const tbody     = document.getElementById("routers-tbody");

  if (routers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:18px">No routers found</td></tr>`;
    return;
  }

  tbody.innerHTML = routers.map(r => {
    const deviceName = deviceMap[r.device_id] || `Device #${r.device_id}`;
    const proto      = r.connection_type || "—";
    const port       = r.port || "—";

    // status: unknown (grey) until statuses load
    let statusBadge;
    if (statuses.length === 0) {
      statusBadge = `<span class="badge" style="background:rgba(90,98,120,.15);color:var(--muted);border:1px solid var(--bd)">checking...</span>`;
    } else {
      const online = statusMap[r.id];
      statusBadge  = online
        ? `<span class="badge online">online</span>`
        : `<span class="badge offline">offline</span>`;
    }

    return `
      <tr>
        <td>${r.name}</td>
        <td class="mono">${r.host}</td>
        <td>${deviceName}</td>
        <td><span class="badge ${proto}">${proto}</span></td>
        <td class="mono">${port}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions">
            <button class="icon-btn run" title="Open terminal" onclick="openTerminal(${r.id}, '${r.name}')">
              <svg viewBox="0 0 16 16"><rect x="1" y="2" width="14" height="11" rx="1"/><polyline points="4 6 7 8 4 10"/></svg>
            </button>
            <button class="icon-btn del" title="Delete" onclick="deleteRouter(${r.id}, '${r.name}')">
              <svg viewBox="0 0 16 16"><polyline points="2 4 4 4 14 4"/><path d="M5 4V3h6v1m1 0v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// ── DELETE ──
async function deleteRouter(id, name) {
  if (!confirm(`Delete router "${name}"?`)) return;
  try {
    const res = await apiFetch(`${API}/routers/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json()).detail);
    await loadRouters();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ── OPEN TERMINAL ──
function openTerminal(routerId, routerName) {
  switchToTerminal(routerId);   // home.js handles nav + connect
}

// ── ADD ROUTER MODAL ──
function showAddRouterModal() {
  const existing = document.getElementById("add-router-modal");
  if (existing) { existing.remove(); return; }

  // populate device options
  const deviceOptions = allDevices.map(d =>
    `<option value="${d.id}">${d.name}</option>`
  ).join("");

  const modal = document.createElement("div");
  modal.id    = "add-router-modal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.6);
    display:flex;align-items:center;justify-content:center;z-index:999;
  `;
  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd2);border-radius:4px;padding:24px;width:420px;max-width:95vw">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text)">Add Router</span>
        <button onclick="document.getElementById('add-router-modal').remove()"
          style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;line-height:1">×</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div class="field-group">
          <div class="field-label">Name</div>
          <input type="text" id="r-name" placeholder="Bluesky-3906"/>
        </div>
        <div class="field-group">
          <div class="field-label">Host / IP</div>
          <input type="text" id="r-host" placeholder="10.0.0.1"/>
        </div>
        <div class="field-group">
          <div class="field-label">Username</div>
          <input type="text" id="r-username" placeholder="admin"/>
        </div>
        <div class="field-group">
          <div class="field-label">Password</div>
          <input type="text" id="r-password" placeholder="secret"/>
        </div>
        <div class="field-group">
          <div class="field-label">Enable Secret</div>
          <input type="text" id="r-secret" placeholder="optional"/>
        </div>
        <div class="field-group">
          <div class="field-label">Device Type</div>
          <select id="r-device">${deviceOptions}</select>
        </div>
        <div class="field-group">
          <div class="field-label">Protocol</div>
          <select id="r-conntype">
            <option value="telnet">telnet</option>
            <option value="ssh">ssh</option>
          </select>
        </div>
        <div class="field-group">
          <div class="field-label">Port</div>
          <input type="text" id="r-port" placeholder="23"/>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn" onclick="document.getElementById('add-router-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="submitAddRouter()">Add Router</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}

async function submitAddRouter() {
  const payload = {
    name:            document.getElementById("r-name").value.trim(),
    host:            document.getElementById("r-host").value.trim(),
    username:        document.getElementById("r-username").value.trim(),
    password:        document.getElementById("r-password").value.trim(),
    secret:          document.getElementById("r-secret").value.trim() || null,
    device_id:       parseInt(document.getElementById("r-device").value),
    connection_type: document.getElementById("r-conntype").value,
    port:            parseInt(document.getElementById("r-port").value) || null,
  };

  if (!payload.name || !payload.host || !payload.username || !payload.password) {
    alert("Name, host, username, password are required."); return;
  }

  try {
    const res = await apiFetch(`${API}/routers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    document.getElementById("add-router-modal").remove();
    await loadRouters();
  } catch (err) {
    alert("Failed: " + err.message);
  }
}
