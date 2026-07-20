// static/js/mobile-nav.js
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("open");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

// close drawer after picking a page, mobile only
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 860) closeSidebar();
  });
});

// drop stale "open" state if rotated/resized to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 860) closeSidebar();
});
