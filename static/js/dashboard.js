// static/js/dashboard.js
async function loadDashboard() {
  try {
    const [routers, schedules, backupSchedules, onetime] = await Promise.all([
      apiFetch(`${API}/routers/`).then(r => r.json()),
      apiFetch(`${API}/schedules/`).then(r => r.json()),
      apiFetch(`${API}/backup-schedules/`).then(r => r.json()),
      apiFetch(`${API}/onetime/`).then(r => r.json()),
    ]);

    renderStatCards(routers, [], schedules, backupSchedules);
    renderUpcoming(onetime, routers);

    apiFetch(`${API}/routers/status`)
      .then(r => r.json())
      .then(statuses => {
        const online  = statuses.filter(r => r.online).length;
        const offline = routers.length - online;
        document.getElementById("stat-online").textContent     = online;
        document.getElementById("stat-online-sub").textContent = `${offline} unreachable`;
      });

  } catch (err) {
    console.error("Dashboard load failed:", err);
  }
}

function renderStatCards(routers, statuses, schedules, backupSchedules) {
  const total     = routers.length;
  const telnet    = routers.filter(r => r.connection_type === "telnet").length;
  const ssh       = routers.filter(r => r.connection_type === "ssh").length;
  const allSched  = [...schedules, ...backupSchedules];
  const totalSch  = allSched.length;
  const activeSch = allSched.filter(s => s.is_active).length;
  const pausedSch = totalSch - activeSch;

  document.getElementById("stat-routers").textContent       = total;
  document.getElementById("stat-routers-sub").textContent   = `${telnet} telnet · ${ssh} ssh`;
  document.getElementById("stat-online").textContent        = "—";
  document.getElementById("stat-online-sub").textContent    = "checking...";
  document.getElementById("stat-schedules").textContent     = totalSch;
  document.getElementById("stat-schedules-sub").textContent = `${activeSch} active · ${pausedSch} paused`;
}

function renderUpcoming(onetime, routers) {
  const routerMap = Object.fromEntries(routers.map(r => [r.id, r.name]));
  const now       = new Date();
  const upcoming  = onetime
    .filter(j => new Date(j.time) > now)
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .slice(0, 8);

  const tbody = document.getElementById("upcoming-tbody");
  if (upcoming.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:18px">No upcoming jobs</td></tr>`;
    return;
  }
  tbody.innerHTML = upcoming.map(j => {
    const routerName = routerMap[j.router_id] || `#${j.router_id}`;
    const time = new Date(j.time).toLocaleString("en-GB", {
      month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"
    });
    return `<tr>
      <td>${routerName}</td>
      <td><span class="badge active">${j.name}</span></td>
      <td class="mono">${time}</td>
    </tr>`;
  }).join("");
}