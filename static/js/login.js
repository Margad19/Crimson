// static/js/login.js
async function handleLogin(e) {
  e.preventDefault();

  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.detail); // "Invalid username or password"
    return;
  }

  localStorage.setItem("token", data.access_token);
  localStorage.setItem("role", data.role);
  window.location.href = "/static/home.html";
}