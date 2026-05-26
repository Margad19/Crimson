// static/js/users.js

async function loadUsers() {
  const tbody = document.getElementById("users-tbody");
  tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted);text-align:center">loading...</td></tr>`;
  try {
    const users = await apiFetch(`${API}/users/`).then(r => r.json());
    renderUsersTable(users);
  } catch {
    tbody.innerHTML = `<tr><td colspan="7" style="color:#ef4444;text-align:center">Failed to load</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById("users-tbody");
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--muted);text-align:center">No users found</td></tr>`;
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td class="mono">${u.id}</td>
      <td>${u.username}</td>
      <td><span class="badge active">${u.role}</span></td>
      <td>${u.email}</td>
      <td class="mono">${u.dob}</td>
      <td class="mono">${u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
      <td><div class="actions">
        <button class="icon-btn del" onclick="deleteUser(${u.id}, '${u.username.replace(/'/g,"\\'")}')">
          <svg viewBox="0 0 16 16"><polyline points="2 4 4 4 14 4"/><path d="M5 4V3h6v1m1 0v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z"/></svg>
        </button>
      </div></td>
    </tr>`).join("");
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    const res = await apiFetch(`${API}/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    loadUsers();
  } catch { alert("Delete failed."); }
}

// ── modal ─────────────────────────────────────────────────────────────────────
function showAddUserModal() {
  const ex = document.getElementById("user-modal"); if (ex) ex.remove();

  const modal = document.createElement("div");
  modal.id = "user-modal";
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);
    display:flex;align-items:center;justify-content:center;z-index:1000`;

  modal.innerHTML = `
    <div style="background:var(--s2);border:1px solid var(--bd);border-radius:6px;
                padding:24px;width:400px;display:flex;flex-direction:column;gap:14px">

      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:600;font-size:13px">Add User</span>
        <button class="icon-btn" onclick="document.getElementById('user-modal').remove()">
          <svg viewBox="0 0 16 16"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
        </button>
      </div>

      <div class="field-group">
        <div class="field-label">Username</div>
        <input id="u-username" type="text" placeholder="e.g. johndoe"/>
      </div>

      <div class="field-group">
        <div class="field-label">Password</div>
        <input id="u-password" type="password" placeholder="Min 8 characters"/>
      </div>

      <div class="field-group">
        <div class="field-label">Role</div>
        <select id="u-role">
          <option value="engineer">Engineer</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <div class="field-group">
        <div class="field-label">Email</div>
        <input id="u-email" type="email" placeholder="user@example.com"/>
      </div>

      <div class="field-group">
        <div class="field-label">Date of Birth</div>
        <input id="u-dob" type="date"/>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
        <button class="btn" onclick="document.getElementById('user-modal').remove()">Cancel</button>
        <button class="btn primary" onclick="submitAddUser()">Add User</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.getElementById("u-username").focus();
}

async function submitAddUser() {
  const username = document.getElementById("u-username").value.trim();
  const password = document.getElementById("u-password").value;
  const role     = document.getElementById("u-role").value;
  const email    = document.getElementById("u-email").value.trim();
  const dob      = document.getElementById("u-dob").value;

  if (!username || !password || !email || !dob) {
    alert("All fields required."); return;
  }
  if (password.length < 8) {
    alert("Password must be at least 8 characters."); return;
  }

  const payload = { username, password_hash: password, role, email, dob };

  try {
    const res = await apiFetch(`${API}/users/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error();
    document.getElementById("user-modal").remove();
    loadUsers();
  } catch { alert("Failed to add user."); }
}
