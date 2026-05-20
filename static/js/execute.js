// static/js/execute.js

const EXEC_USER_ID = 1; // swap for session user when auth is added

let _execRouters  = [];
let _execCommands = [];

async function loadExecute() {
  try {
    const [routers, commands] = await Promise.all([
      fetch(`${API}/routers/`).then(r => r.json()),
      fetch(`${API}/commands/`).then(r => r.json()),
    ]);
    _execRouters  = routers;
    _execCommands = commands;
    populateExecRouters();
    setExecOutput("— awaiting execution —", false);
  } catch {
    setExecOutput("Failed to load routers / commands.", true);
  }
}

function populateExecRouters() {
  const sel = document.getElementById("exec-router-sel");
  sel.innerHTML = _execRouters.length
    ? _execRouters.map(r => `<option value="${r.id}" data-device="${r.device_id}">${r.name}</option>`).join("")
    : `<option value="" disabled>No routers found</option>`;
  populateExecCommands();
}

function populateExecCommands() {
  const routerSel = document.getElementById("exec-router-sel");
  const cmdSel    = document.getElementById("exec-cmd-sel");
  const selected  = routerSel.options[routerSel.selectedIndex];
  const deviceId  = selected ? Number(selected.dataset.device) : null;

  // only show commands that match the router's device type
  const compatible = deviceId
    ? _execCommands.filter(c => c.device_id === deviceId)
    : _execCommands;

  cmdSel.innerHTML = compatible.length
    ? compatible.map(c => `<option value="${c.id}">${c.name}</option>`).join("")
    : `<option value="" disabled>No compatible commands</option>`;
}

async function runExecute() {
  const routerId = Number(document.getElementById("exec-router-sel").value);
  const cmdId    = Number(document.getElementById("exec-cmd-sel").value);

  if (!routerId || !cmdId) {
    setExecOutput("Select a router and command.", true);
    return;
  }

  setExecOutput("Connecting…", false);
  document.getElementById("exec-run-btn").disabled = true;

  try {
    const res = await fetch(`${API}/execute/`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ router_id: routerId, command_id: cmdId, user_id: EXEC_USER_ID }),
    });

    const data = await res.json();

    if (!res.ok) {
      setExecOutput(`Error: ${data.detail ?? "Unknown error"}`, true);
      return;
    }

    const header = `Router : ${data.router_name}\nCommand: ${data.command_name}\nTime   : ${new Date(data.executed_at).toLocaleString()}\n${"─".repeat(48)}\n`;
    setExecOutput(header + data.output, false);

  } catch {
    setExecOutput("Request failed. Is the API reachable?", true);
  } finally {
    document.getElementById("exec-run-btn").disabled = false;
  }
}

function setExecOutput(text, isError) {
  const box = document.getElementById("exec-output");
  box.textContent = text;
  box.style.color = isError ? "#ef4444" : "var(--fg)";
}
