// static/js/devices.js
async function loadDevices() {
  const tbody = document.getElementById("devices-tbody");
  tbody.innerHTML = `<tr><td colspan="4" style="color:var(--muted);text-align:center;padding:18px">Loading...</td></tr>`;
  try {
    const devices = await apiFetch(`${API}/devices/`).then(r => r.json());
    renderDevicesTable(devices);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--red);text-align:center;padding:18px">Failed to load devices</td></tr>`;
    console.error(err);
  }
}

function renderDevicesTable(devices) {
  const tbody = document.getElementById("devices-tbody");
  if (devices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--muted);text-align:center;padding:18px">No device types found</td></tr>`;
    return;
  }
  tbody.innerHTML = devices.map(d => `
    <tr>
      <td>${d.name}</td>
      <td class="mono">${d.netmiko_type}</td>
      <td class="mono" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
          title="${d.backup_command}">${d.backup_command}</td>
      <td>
        <div class="actions">
          <button class="icon-btn" title="Edit" onclick="showEditDeviceModal(${d.id},'${escQ(d.name)}','${escQ(d.netmiko_type)}','${escQ(d.backup_command)}','${escQ(d.backup_tftp_command||'')}')">
            <svg viewBox="0 0 16 16"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg>
          </button>
          <button class="icon-btn del" title="Delete" onclick="deleteDevice(${d.id},'${escQ(d.name)}')">
            <svg viewBox="0 0 16 16"><polyline points="2 4 4 4 14 4"/><path d="M5 4V3h6v1m1 0v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join("");
}

// escape single quotes for inline onclick attrs
function escQ(str) {
  return (str || "").replace(/'/g, "\\'");
}

async function deleteDevice(id, name) {
  if (!confirm(`Delete device type "${name}"?\nAll routers using this type will lose their device reference.`)) return;
  try {
    const res = await apiFetch(`${API}/devices/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error((await res.json()).detail);
    await loadDevices();
  } catch (err) {
    alert("Delete failed: " + err.message);
  }
}

// ── SHARED MODAL ──
function deviceModal({ title, id = null, name = "", netmiko = "", backup = "", backupTftp = "" }) {
  document.getElementById("device-modal")?.remove();

  const modal = document.createElement("div");
  modal.id    = "device-modal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.6);
    display:flex;align-items:center;justify-content:center;z-index:999;
  `;
  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd2);border-radius:4px;padding:24px;width:460px;max-width:95vw">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text)">${title}</span>
        <button onclick="document.getElementById('device-modal').remove()"
          style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;line-height:1">×</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
        <div class="field-group">
          <div class="field-label">Name</div>
          <input type="text" id="d-name" placeholder="ZTE ZXROS" value="${name}"/>
        </div>
        <div class="field-group">
          <div class="field-label">Netmiko Type</div>
          <input type="text" id="d-netmiko" placeholder="zte_zxros" value="${netmiko}"/>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">e.g. cisco_ios, cisco_xe, zte_zxros, huawei_vrp</div>
        </div>
        <div class="field-group">
          <div class="field-label">Backup Command (show running → .txt)</div>
          <input type="text" id="d-backup" placeholder="show running-config" value="${backup}"/>
        </div>
        <div class="field-group">
          <div class="field-label">Backup TFTP Command (→ .dat)</div>
          <input type="text" id="d-backup-tftp"
            placeholder="copy flash:/cfg/startrun.dat tftp://{tftp_host}/{filename}.dat"
            value="${backupTftp}"/>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">
            Use <code style="color:var(--accent)">{tftp_host}</code> and
            <code style="color:var(--accent)">{filename}</code> as placeholders
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn" onclick="document.getElementById('device-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="${id ? `submitEditDevice(${id})` : 'submitAddDevice()'}">
          ${id ? "Save Changes" : "Add Device"}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}

function showAddDeviceModal() {
  deviceModal({ title: "Add Device Type" });
}

function showEditDeviceModal(id, name, netmiko, backup, backupTftp) {
  deviceModal({ title: "Edit Device Type", id, name, netmiko, backup, backupTftp });
}

function getDeviceFormPayload() {
  return {
    name:                document.getElementById("d-name").value.trim(),
    netmiko_type:        document.getElementById("d-netmiko").value.trim(),
    backup_command:      document.getElementById("d-backup").value.trim(),
    backup_tftp_command: document.getElementById("d-backup-tftp").value.trim() || null,
  };
}

async function submitAddDevice() {
  const payload = getDeviceFormPayload();
  if (!payload.name || !payload.netmiko_type || !payload.backup_command) {
    alert("Name, netmiko type, and backup command are required."); return;
  }
  try {
    const res = await apiFetch(`${API}/devices/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    document.getElementById("device-modal").remove();
    await loadDevices();
  } catch (err) {
    alert("Failed: " + err.message);
  }
}

async function submitEditDevice(id) {
  const payload = getDeviceFormPayload();
  if (!payload.name || !payload.netmiko_type || !payload.backup_command) {
    alert("Name, netmiko type, and backup command are required."); return;
  }
  try {
    const res = await apiFetch(`${API}/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).detail);
    document.getElementById("device-modal").remove();
    await loadDevices();
  } catch (err) {
    alert("Failed: " + err.message);
  }
}
