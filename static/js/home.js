// static/js/home.js
const API    = "http://localhost:8000";
const WS_API = "ws://localhost:8000";

const titles = {
  dashboard:'Dashboard', routers:'Routers', devices:'Device Types',
  ftp:'TFTP Servers', commands:'Commands', execute:'Execute Command',
  backup:'Backup', schedules:'Schedules', onetime:'One-Time Jobs',
  terminal:'Live Terminal', users:'Users'
};

function nav(el, id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('s-' + id).classList.add('active');
  document.getElementById('page-title').textContent = titles[id];
  if (id === "dashboard") loadDashboard();
  if (id === "routers")   loadRouters();
  if (id === "devices")   loadDevices();
  if (id === "ftp")       loadFtp();
  if (id === "commands")  loadCommands();
  if (id === "execute")   loadExecute();
  if (id === "backup")    loadBackup();
  if (id === "schedules") loadSchedules();
  if (id === "onetime")   loadOnetime();
  if (id === "users")     loadUsers();
}

// ════ TERMINAL ════════════════════════════════════════════════════════════════
let ws        = null;
let connected = false;

function connectTerminal() {
  // disconnect existing session first
  if (ws) { ws.close(); ws = null; }

  const sel  = document.getElementById("term-router-select");
  const id   = sel.value;
  const name = sel.options[sel.selectedIndex]?.text ?? "router";

  const out = document.getElementById("term-output");
  const inp = document.getElementById("term-input");

  out.textContent = `Connecting to ${name}...\n`;
  setTermState("connecting", name);

  ws = new WebSocket(`${WS_API}/terminal/${id}`);

  ws.onopen = () => {
    // backend sends initial prompt after open — nothing to do here
  };

  ws.onmessage = e => {
    out.textContent += e.data + "\n";
    out.scrollTop = out.scrollHeight;

    // first message = "Connected. Prompt: X#" → enable input
    if (!connected) {
      connected = true;
      inp.disabled = false;
      inp.placeholder = "type command and press Enter...";
      inp.focus();
      setTermState("online", name);
    }
  };

  ws.onerror = () => {
    out.textContent += "\nWebSocket error.\n";
    setTermState("offline", name);
  };

  ws.onclose = () => {
    connected = false;
    ws = null;
    inp.disabled = true;
    out.textContent += "\nSession closed.\n";
    setTermState("offline", name);
  };
}

function disconnectTerminal() {
  if (ws) { ws.close(); ws = null; }
  // onclose handler above handles UI reset
}

function termKeydown(e) {
  if (e.key !== "Enter") return;
  const inp = document.getElementById("term-input");
  const cmd = inp.value.trim();
  if (!cmd || !ws || ws.readyState !== WebSocket.OPEN) return;

  const out    = document.getElementById("term-output");
  const prompt = document.getElementById("term-prompt").textContent;
  out.textContent += `${prompt} ${cmd}\n`;
  out.scrollTop = out.scrollHeight;
  inp.value = "";

  if (cmd.toLowerCase() === "exit" || cmd.toLowerCase() === "disconnect") {
    ws.send(cmd);
    disconnectTerminal();
    return;
  }

  ws.send(cmd);
}

// ── terminal UI state ──────────────────────────────────────────────────────
function setTermState(state, name) {
  const label  = document.getElementById("term-label");
  const dotR   = document.getElementById("td-r");
  const dotY   = document.getElementById("td-y");
  const dotG   = document.getElementById("td-g");
  const prompt = document.getElementById("term-prompt");

  const off = "#1a1e22";
  dotR.style.background = off;
  dotY.style.background = off;
  dotG.style.background = off;

  if (state === "online") {
    dotG.style.background  = "#22c55e";
    label.textContent      = name;
    prompt.textContent     = name.split("-")[0].toLowerCase() + "#";
  } else if (state === "connecting") {
    dotY.style.background  = "#f59e0b";
    label.textContent      = `connecting to ${name}...`;
    prompt.textContent     = "$";
  } else {
    dotR.style.background  = "#ef4444";
    label.textContent      = "not connected";
    prompt.textContent     = "$";
  }
}

// ── auto-connect from router table button ──────────────────────────────────
// called by routers.js openTerminal()
function switchToTerminal(routerId) {
  const termNav = document.querySelector(`[onclick="nav(this,'terminal')"]`);
  nav(termNav, "terminal");

  const sel = document.getElementById("term-router-select");
  for (const opt of sel.options) {
    if (parseInt(opt.value) === routerId) { sel.value = opt.value; break; }
  }
  connectTerminal();
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});