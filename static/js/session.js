// static/js/session.js
function getToken() {
  return localStorage.getItem("token");
}

function getRole() {
  return localStorage.getItem("role");
}

function getUserId() {
  return localStorage.getItem("user_id");
}

function saveSession(data) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("user_id", String(data.user_id));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user_id");
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "/static/login.html";
  }
}

// authenticated fetch — auto attaches token
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`,
      ...(options.headers || {}),
    }
  });

  if (res.status === 401) {
    clearSession();
    window.location.href = "/static/login.html";
    return;
  }

  return res;
}

function logout() {
  clearSession();
  window.location.href = "/static/login.html";
}