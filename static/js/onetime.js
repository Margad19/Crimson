// static/js/onetime.js

const ONETIME_USER_ID = 1;

let _otRouters  = [];
let _otCommands = [];

async function loadOnetime() {
  const tbody = document.getElementById("onetime-tbody");
  tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center">loading...</td></tr>`;
  try {
    const [jobs, routers, commands] = await Promise.all([
      fetch(`${API}/onetime/`).then(r => r.json()),
      fetch(`${API}/routers/`).then(r => r.json()),
      fetch(`${API}/commands/`).then(r => r.json()),
    ]);
    _otRouters  = routers;
    _otCommands = commands;
    renderOnetimeTable(jobs);
  } catch {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;text-align:center">Failed to load</td></tr>`;
  }
}

function renderOnetimeTable(jobs) {
  const tbody = document.getElementById("onetime-tbody");
  const rMap  = Object.fromEntries(_otRouters.map(r  => [r.id, r.name]));
  const cMap  = Object.fromEntries(_otCommands.map(c => [c.id, c.name]));

  if (!jobs.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center">No jobs found</td></tr>`;
    return;
  }

  const now = Date.now();
  tbody.innerHTML = jobs.map(j => {
    const runAt  = new Date(j.time);
    const past   = runAt.getTime() < now;
    const timeStr = runAt.toLocaleString();
    return `
      <tr>
        <td>${j.name}</td>
        <td>${rMap[j.router_id]  ?? "—"}</td>
        <td>${cMap[j.command_id] ?? "—"}</td>
        <td class="mono" style="color:${past ? "var(--muted)" : "var(--fg)"}">
          ${timeStr}
          ${past ? `<span style="color:#f59e0b;font-size:10px;margin-left:6px">ran</span>` : ""}
        </td>
        <td><div class="actions">
          <button class="icon-btn del" onclick="deleteOnetime(${j.id}, '${j.name.replace(/'/g,"\\'")}')">
            <svg viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
          </button>
        </div></td>
      </tr>`;
  }).join("");
}

async function deleteOnetime(id, name) {
  if (!confirm(`Cancel "${name}"?`)) return;
  try {
    const res = await fetch(`${API}/onetime/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    loadOnetime();
  } catch { alert("Delete failed."); }
}

// ── modal ─────────────────────────────────────────────────────────────────────
function showAddOnetimeModal() {
  const ex = document.getElementById("ot-modal"); if (ex) ex.remove();

  // default datetime = now + 1h, rounded to nearest minute
  const def = new Date(Date.now() + 3600_000);
  def.setSeconds(0, 0);
  const localISO = new Date(def.getTime() - def.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);

  const routerOpts = _otRouters.map(r =>
    `<option value="${r.id}" data-device="${r.device_id}">${r.name}</option>`).join("");

  const modal = document.createElement("div");
  modal.id = "ot-modal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);
    display:flex;align-items:center;justify-content:center;z-index:1000`;

  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd);border-radius:6px;
                padding:24px;width:400px;display:flex;flex-direction:column;gap:14px">

      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;font-size:13px">New One-Time Job</span>
        <button class="icon-btn" onclick="document.getElementById('ot-modal').remove()">
          <svg viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>

      <div class="field-group">
        <div class="field-label">Job Name</div>
        <input id="ot-name" type="text" placeholder="e.g. clear arp table"/>
      </div>

      <div class="field-group">
        <div class="field-label">Router</div>
        <select id="ot-router" onchange="otRouterChange()">${routerOpts}</select>
      </div>

      <div class="field-group">
        <div class="field-label">Command</div>
        <select id="ot-command"></select>
      </div>

      <div class="field-group">
        <div class="field-label">Run At</div>
        <input id="ot-time" type="datetime-local" value="${localISO}"/>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn" onclick="document.getElementById('ot-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="submitOnetime()">Schedule Job</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  otRouterChange();
  document.getElementById("ot-name").focus();
}

function otRouterChange() {
  const sel      = document.getElementById("ot-router");
  const cmdSel   = document.getElementById("ot-command");
  const deviceId = Number(sel.options[sel.selectedIndex]?.dataset.device);
  const filtered = deviceId
    ? _otCommands.filter(c => c.device_id === deviceId)
    : _otCommands;
  cmdSel.innerHTML = filtered.length
    ? filtered.map(c => `<option value="${c.id}">${c.name}</option>`).join("")
    : `<option value="" disabled>No compatible commands</option>`;
}

async function submitOnetime() {
  const name      = document.getElementById("ot-name").value.trim();
  const routerId  = Number(document.getElementById("ot-router").value);
  const commandId = Number(document.getElementById("ot-command").value);
  const timeVal   = document.getElementById("ot-time").value;

  if (!name || !routerId || !commandId || !timeVal) {
    alert("All fields required."); return;
  }

  const runAt = new Date(timeVal);
  if (runAt.getTime() <= Date.now()) {
    alert("Run time must be in the future."); return;
  }

  const payload = {
    name,
    router_id:  routerId,
    command_id: commandId,
    time:       runAt.toISOString(),
    user_id:    ONETIME_USER_ID,
  };

  try {
    const res = await fetch(`${API}/onetime/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    document.getElementById("ot-modal").remove();
    loadOnetime();
  } catch { alert("Failed to create job."); }
}
