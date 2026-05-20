// static/js/ftp.js

async function loadFtp() {
  const tbody = document.getElementById("ftp-tbody");
  tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center">loading...</td></tr>`;
  try {
    const res = await fetch(`${API}/ftp/`);
    const data = await res.json();
    renderFtpTable(data);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:#ef4444;text-align:center">Failed to load</td></tr>`;
  }
}

function renderFtpTable(servers) {
  const tbody = document.getElementById("ftp-tbody");
  if (!servers.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center">No servers found</td></tr>`;
    return;
  }
  tbody.innerHTML = servers.map(s => `
    <tr>
      <td>${s.name}</td>
      <td class="mono">${s.host}</td>
      <td class="mono">${s.directory ?? "—"}</td>
      <td>${s.username ? "credentials" : "none"}</td>
      <td><div class="actions">
        <button class="icon-btn del" onclick="deleteFtp(${s.id}, '${s.name}')" title="Delete">
          <svg viewBox="0 0 16 16"><polyline points="2 4 4 4 14 4"/><path d="M5 4V3h6v1m1 0v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"/></svg>
        </button>
      </div></td>
    </tr>`).join("");
}

async function deleteFtp(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    const res = await fetch(`${API}/ftp/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    loadFtp();
  } catch {
    alert("Delete failed.");
  }
}

function showAddFtpModal() {
  const existing = document.getElementById("ftp-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "ftp-modal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);
    display:flex;align-items:center;justify-content:center;z-index:1000`;

  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd);border-radius:6px;
                padding:24px;width:380px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;font-size:13px">Add TFTP Server</span>
        <button class="icon-btn" onclick="document.getElementById('ftp-modal').remove()">
          <svg viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>

      ${["name:Name:text","host:Host / IP:text","username:Username (optional):text",
         "password:Password (optional):password","directory:Directory (optional):text"]
        .map(f => {
          const [id, label, type] = f.split(":");
          return `
            <div class="field-group">
              <div class="field-label">${label}</div>
              <input id="ftp-f-${id}" type="${type}" placeholder="${label}"/>
            </div>`;
        }).join("")}

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn" onclick="document.getElementById('ftp-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="submitAddFtp()">Add Server</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.getElementById("ftp-f-name").focus();
}

async function submitAddFtp() {
  const get = id => document.getElementById("ftp-f-" + id)?.value.trim();
  const name = get("name"), host = get("host");
  if (!name || !host) { alert("Name and Host required."); return; }

  const payload = {
    name,
    host,
    username:  get("username")  || null,
    password:  get("password")  || null,
    directory: get("directory") || null,
  };

  try {
    const res = await fetch(`${API}/ftp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    document.getElementById("ftp-modal").remove();
    loadFtp();
  } catch {
    alert("Failed to add server.");
  }
}
