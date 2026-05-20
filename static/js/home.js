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
}

// ── dummy terminal ──
let ws = null;
let connected = false;

function connectTerminal() {
  const sel = document.getElementById('term-router-select');
  const name = sel.options[sel.selectedIndex].text;
  const id = sel.value;
  const out = document.getElementById('term-output');
  const inp = document.getElementById('term-input');
  document.getElementById('term-label').textContent = name;
  document.getElementById('td-g').style.background = '#22c55e';
  inp.disabled = false;
  inp.placeholder = 'type command and press Enter...';
  inp.focus();
  document.getElementById('term-prompt').textContent = name.split('-')[0].toLowerCase() + '#';
  out.textContent = 'Connecting to ' + name + '...\nConnected. Prompt: ' + name + '#\n';
  connected = true;

  // real ws:
  // ws = new WebSocket('ws://localhost:8000/terminal/' + id);
  // ws.onmessage = e => { out.textContent += e.data + '\n'; out.scrollTop = out.scrollHeight; };
}

function disconnectTerminal() {
  connected = false;
  if (ws) { ws.close(); ws = null; }
  const out = document.getElementById('term-output');
  out.textContent += '\nSession closed.\n';
  document.getElementById('term-input').disabled = true;
  document.getElementById('term-label').textContent = 'not connected';
  document.getElementById('td-g').style.background = '#1a1e22';
}

function termKeydown(e) {
  if (e.key !== 'Enter') return;
  const inp = document.getElementById('term-input');
  const cmd = inp.value.trim();
  if (!cmd) return;
  const out = document.getElementById('term-output');
  const prompt = document.getElementById('term-prompt').textContent;
  out.textContent += prompt + ' ' + cmd + '\n';
  inp.value = '';
  if (cmd === 'exit') { disconnectTerminal(); return; }
  // send via ws: ws.send(cmd);
  out.textContent += '-- [send to router via WebSocket] --\n';
  out.scrollTop = out.scrollHeight;
}