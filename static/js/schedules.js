// static/js/schedules.js

const SCHED_USER_ID = 1;

let _schedRouters  = [];
let _schedCommands = [];
let _schedFtps     = [];

// ── human-readable cron ──────────────────────────────────────────────────────
function cronToHuman(expr) {
  if (!expr) return expr;
  const [min, hour, dom, , dow] = expr.trim().split(" ");
  const pad  = n => String(n).padStart(2, "0");
  const time = `${pad(hour)}:${pad(min)}`;
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  if (min === "0" && hour === "*" && dom === "*" && dow === "*") return "Every hour";
  if (dom === "*" && dow === "*") return `Daily at ${time}`;
  if (dom === "*" && dow !== "*") return `Weekly on ${days[dow] ?? "day "+dow} at ${time}`;
  if (dom !== "*" && dow === "*") return `Monthly on day ${dom} at ${time}`;
  return expr;
}

// ── tab switcher ─────────────────────────────────────────────────────────────
function switchSchedTab(tab) {
  ["cmd","bak"].forEach(t => {
    document.getElementById(`sched-tab-${t}`).classList.toggle("active", t === tab);
    document.getElementById(`sched-panel-${t}`).style.display = t === tab ? "" : "none";
  });
}

// ── load all ─────────────────────────────────────────────────────────────────
async function loadSchedules() {
  setCmdTbody(`<tr><td colspan="6" style="color:var(--muted);text-align:center">loading...</td></tr>`);
  setBakTbody(`<tr><td colspan="5" style="color:var(--muted);text-align:center">loading...</td></tr>`);
  try {
    const [cmdScheds, bakScheds, routers, commands, ftps] = await Promise.all([
      fetch(`${API}/schedules/`).then(r => r.json()),
      fetch(`${API}/backup-schedules/`).then(r => r.json()),
      fetch(`${API}/routers/`).then(r => r.json()),
      fetch(`${API}/commands/`).then(r => r.json()),
      fetch(`${API}/ftp/`).then(r => r.json()),
    ]);
    _schedRouters  = routers;
    _schedCommands = commands;
    _schedFtps     = ftps;
    renderCmdSchedules(cmdScheds);
    renderBakSchedules(bakScheds);
  } catch {
    setCmdTbody(`<tr><td colspan="6" style="color:#ef4444;text-align:center">Failed to load</td></tr>`);
    setBakTbody(`<tr><td colspan="5" style="color:#ef4444;text-align:center">Failed to load</td></tr>`);
  }
}

const setCmdTbody = html => document.getElementById("cmd-sched-tbody").innerHTML = html;
const setBakTbody = html => document.getElementById("bak-sched-tbody").innerHTML = html;

// ── render command schedules ─────────────────────────────────────────────────
function renderCmdSchedules(scheds) {
  const rMap = Object.fromEntries(_schedRouters.map(r  => [r.id, r.name]));
  const cMap = Object.fromEntries(_schedCommands.map(c => [c.id, c.name]));
  if (!scheds.length) { setCmdTbody(`<tr><td colspan="6" style="color:var(--muted);text-align:center">No schedules</td></tr>`); return; }
  setCmdTbody(scheds.map(s => `
    <tr>
      <td>${rMap[s.router_id]  ?? "—"}</td>
      <td>${cMap[s.command_id] ?? "—"}</td>
      <td>${cronToHuman(s.cron_expr)}</td>
      <td class="mono" style="color:var(--muted);font-size:11px">${s.cron_expr}</td>
      <td><span class="badge ${s.is_active ? "active" : "paused"}">${s.is_active ? "active" : "paused"}</span></td>
      <td><div class="actions">
        <button class="icon-btn" onclick="toggleCmdSchedule(${s.id})" title="${s.is_active ? "Pause" : "Resume"}">
          <svg viewBox="0 0 16 16">${s.is_active
            ? `<rect x="3" y="3" width="3" height="10" rx=".5" fill="currentColor"/><rect x="10" y="3" width="3" height="10" rx=".5" fill="currentColor"/>`
            : `<polygon points="3,2 13,8 3,14" fill="currentColor" stroke="none"/>`}</svg>
        </button>
        <button class="icon-btn del" onclick="deleteCmdSchedule(${s.id})">
          <svg viewBox="0 0 16 16"><polyline points="2 4 4 4 14 4"/><path d="M5 4V3h6v1m1 0v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"/></svg>
        </button>
      </div></td>
    </tr>`).join(""));
}

// ── render backup schedules ──────────────────────────────────────────────────
function renderBakSchedules(scheds) {
  const rMap = Object.fromEntries(_schedRouters.map(r => [r.id, r.name]));
  const fMap = Object.fromEntries(_schedFtps.map(f   => [f.id, f.name]));
  if (!scheds.length) { setBakTbody(`<tr><td colspan="5" style="color:var(--muted);text-align:center">No schedules</td></tr>`); return; }
  setBakTbody(scheds.map(s => `
    <tr>
      <td>${rMap[s.router_id] ?? "—"}</td>
      <td>${fMap[s.ftp_id]    ?? "—"}</td>
      <td>${cronToHuman(s.cron_expr)}</td>
      <td class="mono" style="color:var(--muted);font-size:11px">${s.cron_expr}</td>
      <td><span class="badge ${s.is_active ? "active" : "paused"}">${s.is_active ? "active" : "paused"}</span></td>
      <td><div class="actions">
        <button class="icon-btn" onclick="toggleBakSchedule(${s.id})" title="${s.is_active ? "Pause" : "Resume"}">
          <svg viewBox="0 0 16 16">${s.is_active
            ? `<rect x="3" y="3" width="3" height="10" rx=".5" fill="currentColor"/><rect x="10" y="3" width="3" height="10" rx=".5" fill="currentColor"/>`
            : `<polygon points="3,2 13,8 3,14" fill="currentColor" stroke="none"/>`}</svg>
        </button>
        <button class="icon-btn del" onclick="deleteBakSchedule(${s.id})">
          <svg viewBox="0 0 16 16"><polyline points="2 4 4 4 14 4"/><path d="M5 4V3h6v1m1 0v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"/></svg>
        </button>
      </div></td>
    </tr>`).join(""));
}

// ── toggle / delete (command) ─────────────────────────────────────────────────
async function toggleCmdSchedule(id) {
  try { const r = await fetch(`${API}/schedules/${id}/toggle`, {method:"PATCH"}); if(!r.ok) throw 0; loadSchedules(); }
  catch { alert("Toggle failed."); }
}
async function deleteCmdSchedule(id) {
  if (!confirm("Delete this schedule?")) return;
  try { const r = await fetch(`${API}/schedules/${id}`, {method:"DELETE"}); if(!r.ok) throw 0; loadSchedules(); }
  catch { alert("Delete failed."); }
}

// ── toggle / delete (backup) ──────────────────────────────────────────────────
async function toggleBakSchedule(id) {
  try { const r = await fetch(`${API}/backup-schedules/${id}/toggle`, {method:"PATCH"}); if(!r.ok) throw 0; loadSchedules(); }
  catch { alert("Toggle failed."); }
}
async function deleteBakSchedule(id) {
  if (!confirm("Delete this backup schedule?")) return;
  try { const r = await fetch(`${API}/backup-schedules/${id}`, {method:"DELETE"}); if(!r.ok) throw 0; loadSchedules(); }
  catch { alert("Delete failed."); }
}

// ── shared cron builder helpers ───────────────────────────────────────────────
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function cronBuilderFields(prefix) {
  const timeField = `
    <div style="display:flex;gap:10px">
      <div class="field-group" style="flex:1">
        <div class="field-label">Hour (0–23)</div>
        <input id="${prefix}-hour" type="number" min="0" max="23" value="2" oninput="${prefix}Preview()"/>
      </div>
      <div class="field-group" style="flex:1">
        <div class="field-label">Minute (0–59)</div>
        <input id="${prefix}-min" type="number" min="0" max="59" value="0" oninput="${prefix}Preview()"/>
      </div>
    </div>`;

  return freq => {
    if (freq === "hourly")  return "";
    if (freq === "daily")   return timeField;
    if (freq === "weekly")  return `
      <div class="field-group">
        <div class="field-label">Day of Week</div>
        <select id="${prefix}-dow" onchange="${prefix}Preview()">
          ${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join("")}
        </select>
      </div>` + timeField;
    if (freq === "monthly") return `
      <div class="field-group">
        <div class="field-label">Day of Month (1–28)</div>
        <input id="${prefix}-dom" type="number" min="1" max="28" value="1" oninput="${prefix}Preview()"/>
      </div>` + timeField;
    if (freq === "custom")  return `
      <div class="field-group">
        <div class="field-label">Cron Expression</div>
        <input id="${prefix}-custom" type="text" placeholder="e.g. 0 2 * * *" oninput="${prefix}Preview()"/>
      </div>`;
    return "";
  };
}

function buildCron(prefix) {
  const freq = document.getElementById(`${prefix}-freq`).value;
  const g    = id => document.getElementById(id)?.value ?? "0";
  if (freq === "hourly")  return "0 * * * *";
  if (freq === "daily")   return `${g(`${prefix}-min`)} ${g(`${prefix}-hour`)} * * *`;
  if (freq === "weekly")  return `${g(`${prefix}-min`)} ${g(`${prefix}-hour`)} * * ${g(`${prefix}-dow`)}`;
  if (freq === "monthly") return `${g(`${prefix}-min`)} ${g(`${prefix}-hour`)} ${g(`${prefix}-dom`)} * *`;
  if (freq === "custom")  return g(`${prefix}-custom`).trim();
  return "";
}

function freqSelect(prefix, changeFn) {
  return `
    <div class="field-group">
      <div class="field-label">Frequency</div>
      <select id="${prefix}-freq" onchange="${changeFn}()">
        <option value="hourly">Every hour</option>
        <option value="daily" selected>Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="custom">Custom (cron)</option>
      </select>
    </div>`;
}

function previewBox(id) {
  return `
    <div style="background:var(--s1);border:1px solid var(--bd);border-radius:4px;
                padding:8px 12px;font-family:'IBM Plex Mono',monospace;font-size:11px;
                display:flex;gap:10px;align-items:center">
      <span style="color:var(--muted)">cron:</span>
      <span id="${id}" style="color:var(--acc)">—</span>
    </div>`;
}

// ── ADD COMMAND SCHEDULE modal ────────────────────────────────────────────────
const _cmdFields = cronBuilderFields("csm");

function showAddCmdScheduleModal() {
  const ex = document.getElementById("csm-modal"); if (ex) ex.remove();
  const routerOpts = _schedRouters.map(r =>
    `<option value="${r.id}" data-device="${r.device_id}">${r.name}</option>`).join("");

  const modal = document.createElement("div");
  modal.id = "csm-modal";
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:1000`;
  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:24px;width:420px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;font-size:13px">New Command Schedule</span>
        <button class="icon-btn" onclick="document.getElementById('csm-modal').remove()">
          <svg viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>
      <div class="field-group">
        <div class="field-label">Router</div>
        <select id="csm-router" onchange="csmRouterChange()">${routerOpts}</select>
      </div>
      <div class="field-group">
        <div class="field-label">Command</div>
        <select id="csm-command"></select>
      </div>
      ${freqSelect("csm","csmFreqChange")}
      <div id="csm-fields"></div>
      ${previewBox("csm-preview")}
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn" onclick="document.getElementById('csm-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="submitCmdSchedule()">Create</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  csmRouterChange(); csmFreqChange();
}

function csmRouterChange() {
  const sel      = document.getElementById("csm-router");
  const cmdSel   = document.getElementById("csm-command");
  const deviceId = Number(sel.options[sel.selectedIndex]?.dataset.device);
  const filtered = deviceId ? _schedCommands.filter(c => c.device_id === deviceId) : _schedCommands;
  cmdSel.innerHTML = filtered.length
    ? filtered.map(c => `<option value="${c.id}">${c.name}</option>`).join("")
    : `<option value="" disabled>No compatible commands</option>`;
}

function csmFreqChange() {
  document.getElementById("csm-fields").innerHTML = _cmdFields(document.getElementById("csm-freq").value);
  csmPreview();
}
function csmPreview() {
  document.getElementById("csm-preview").textContent = buildCron("csm") || "—";
}

async function submitCmdSchedule() {
  const routerId  = Number(document.getElementById("csm-router").value);
  const commandId = Number(document.getElementById("csm-command").value);
  const cron      = buildCron("csm");
  if (!routerId || !commandId || !cron) { alert("Fill all fields."); return; }
  try {
    const res = await fetch(`${API}/schedules/`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({router_id:routerId, command_id:commandId, cron_expr:cron, user_id:SCHED_USER_ID}),
    });
    if (!res.ok) throw 0;
    document.getElementById("csm-modal").remove();
    loadSchedules();
  } catch { alert("Failed to create schedule."); }
}

// ── ADD BACKUP SCHEDULE modal ─────────────────────────────────────────────────
const _bakFields = cronBuilderFields("bsm");

function showAddBakScheduleModal() {
  const ex = document.getElementById("bsm-modal"); if (ex) ex.remove();
  const routerOpts = _schedRouters.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  const ftpOpts    = _schedFtps.map(f    => `<option value="${f.id}">${f.name} (${f.host})</option>`).join("");

  const modal = document.createElement("div");
  modal.id = "bsm-modal";
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:1000`;
  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd);border-radius:6px;padding:24px;width:420px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;font-size:13px">New Backup Schedule</span>
        <button class="icon-btn" onclick="document.getElementById('bsm-modal').remove()">
          <svg viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>
      <div class="field-group">
        <div class="field-label">Router</div>
        <select id="bsm-router">${routerOpts}</select>
      </div>
      <div class="field-group">
        <div class="field-label">TFTP Server</div>
        <select id="bsm-ftp">${ftpOpts}</select>
      </div>
      ${freqSelect("bsm","bsmFreqChange")}
      <div id="bsm-fields"></div>
      ${previewBox("bsm-preview")}
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn" onclick="document.getElementById('bsm-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="submitBakSchedule()">Create</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  bsmFreqChange();
}

function bsmFreqChange() {
  document.getElementById("bsm-fields").innerHTML = _bakFields(document.getElementById("bsm-freq").value);
  bsmPreview();
}
function bsmPreview() {
  document.getElementById("bsm-preview").textContent = buildCron("bsm") || "—";
}

async function submitBakSchedule() {
  const routerId = Number(document.getElementById("bsm-router").value);
  const ftpId    = Number(document.getElementById("bsm-ftp").value);
  const cron     = buildCron("bsm");
  if (!routerId || !ftpId || !cron) { alert("Fill all fields."); return; }
  try {
    const res = await fetch(`${API}/backup-schedules/`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({router_id:routerId, ftp_id:ftpId, cron_expr:cron, user_id:SCHED_USER_ID}),
    });
    if (!res.ok) throw 0;
    document.getElementById("bsm-modal").remove();
    loadSchedules();
  } catch { alert("Failed to create backup schedule."); }
}