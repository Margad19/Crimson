// static/js/backup.js

const BACKUP_USER_ID = 1; // swap for session user when auth is added

async function loadBackup() {
  try {
    const [routers, ftps] = await Promise.all([
      apiFetch(`${API}/routers/`).then(r => r.json()),
      apiFetch(`${API}/ftp/`).then(r => r.json()),
    ]);

    const routerSel = document.getElementById("backup-router-sel");
    const ftpSel    = document.getElementById("backup-ftp-sel");

    routerSel.innerHTML = routers.length
      ? routers.map(r => `<option value="${r.id}">${r.name}</option>`).join("")
      : `<option value="" disabled>No routers found</option>`;

    ftpSel.innerHTML = ftps.length
      ? ftps.map(f => `<option value="${f.id}">${f.name} (${f.host})</option>`).join("")
      : `<option value="" disabled>No TFTP servers found</option>`;

    setBackupOutput("— awaiting backup —", false);
  } catch {
    setBackupOutput("Failed to load routers / TFTP servers.", true);
  }
}

async function runBackup() {
  const routerId = Number(document.getElementById("backup-router-sel").value);
  const ftpId    = Number(document.getElementById("backup-ftp-sel").value);

  if (!routerId || !ftpId) {
    setBackupOutput("Select a router and TFTP server.", true);
    return;
  }

  setBackupOutput("Connecting and running backup…", false);
  document.getElementById("backup-run-btn").disabled = true;

  try {
    const res = await apiFetch(`${API}/backup/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ router_id: routerId, ftp_id: ftpId, user_id: BACKUP_USER_ID }),
    });

    const data = await res.json();

    if (!res.ok) {
      setBackupOutput(`Error: ${data.detail ?? "Unknown error"}`, true);
      return;
    }

    const out =
      `Router     : ${data.router_name}\n` +
      `TFTP Server: ${data.ftp_server}\n` +
      `File (.dat): ${data.filename_dat}\n` +
      `File (.txt): ${data.filename_txt}\n` +
      `Status     : ${data.status}\n` +
      `Time       : ${new Date(data.executed_at).toLocaleString()}\n` +
      `${"─".repeat(48)}\n` +
      data.dat_output;

    setBackupOutput(out, false);

  } catch {
    setBackupOutput("Request failed. Is the API reachable?", true);
  } finally {
    document.getElementById("backup-run-btn").disabled = false;
  }
}

function setBackupOutput(text, isError) {
  const box = document.getElementById("backup-output");
  box.textContent = text;
  box.style.color = isError ? "#ef4444" : "var(--fg)";
}
