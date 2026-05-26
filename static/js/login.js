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
  console.log(data);  // ← add this temporarily, check console
  saveSession(data);

  if (!res.ok) {
    alert(data.detail);
    return;
  }

  saveSession(data);  // ← use session.js
  window.location.href = "/static/home.html";
}