// static/js/commands.js

let _deviceMap = {};  // id → name cache

async function loadCommands() {
  const tbody = document.getElementById("commands-tbody");
  tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center">loading...</td></tr>`;
  try {
    const [cmds, devs] = await Promise.all([
      fetch(`${API}/commands/`).then(r => r.json()),
      fetch(`${API}/devices/`).then(r => r.json()),
    ]);
    _deviceMap = Object.fromEntries(devs.map(d => [d.id, d.name]));
    renderCommandsTable(cmds);
  } catch {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;text-align:center">Failed to load</td></tr>`;
  }
}

function renderCommandsTable(cmds) {
  const tbody = document.getElementById("commands-tbody");
  if (!cmds.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center">No commands found</td></tr>`;
    return;
  }
  tbody.innerHTML = cmds.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${_deviceMap[c.device_id] ?? "—"}</td>
      <td class="mono" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
          title="${c.command_text}">${c.command_text}</td>
      <td style="color:var(--muted)">${c.description ?? "—"}</td>
      <td><div class="actions">
        <button class="icon-btn del" onclick="deleteCommand(${c.id}, '${c.name.replace(/'/g,"\\'")}')">
          <svg viewBox="0 0 16 16"><polyline points="2 4 4 4 14 4"/><path d="M5 4V3h6v1m1 0v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"/></svg>
        </button>
      </div></td>
    </tr>`).join("");
}

async function deleteCommand(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    const res = await fetch(`${API}/commands/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    loadCommands();
  } catch {
    alert("Delete failed.");
  }
}

async function showAddCommandModal() {
  const existing = document.getElementById("cmd-modal");
  if (existing) existing.remove();

  // fetch devices for dropdown
  let devices = [];
  try {
    devices = await fetch(`${API}/devices/`).then(r => r.json());
  } catch { /* use empty */ }

  const modal = document.createElement("div");
  modal.id = "cmd-modal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);
    display:flex;align-items:center;justify-content:center;z-index:1000`;

  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd);border-radius:6px;
                padding:24px;width:400px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;font-size:13px">Add Command</span>
        <button class="icon-btn" onclick="document.getElementById('cmd-modal').remove()">
          <svg viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>

      <div class="field-group">
        <div class="field-label">Name</div>
        <input id="cmd-f-name" type="text" placeholder="e.g. Show Version"/>
      </div>

      <div class="field-group">
        <div class="field-label">Device Type</div>
        <select id="cmd-f-device">
          ${devices.length
            ? devices.map(d => `<option value="${d.id}">${d.name}</option>`).join("")
            : `<option value="" disabled>No device types found</option>`}
        </select>
      </div>

      <div class="field-group">
        <div class="field-label">Command</div>
        <input id="cmd-f-text" type="text" placeholder="e.g. show version"/>
      </div>

      <div class="field-group">
        <div class="field-label">Description</div>
        <input id="cmd-f-desc" type="text" placeholder="Short description"/>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn" onclick="document.getElementById('cmd-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="submitAddCommand()">Add Command</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.getElementById("cmd-f-name").focus();
}

async function submitAddCommand() {
  const name     = document.getElementById("cmd-f-name").value.trim();
  const text     = document.getElementById("cmd-f-text").value.trim();
  const desc     = document.getElementById("cmd-f-desc").value.trim();
  const deviceId = document.getElementById("cmd-f-device").value;

  if (!name || !text || !deviceId) { alert("Name, Command, and Device Type required."); return; }

  const payload = { name, command_text: text, description: desc, device_id: Number(deviceId) };

  try {
    const res = await fetch(`${API}/commands/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    document.getElementById("cmd-modal").remove();
    loadCommands();
  } catch {
    alert("Failed to add command.");
  }
}
