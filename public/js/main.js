// ── Auth state ──────────────────────────────────────────────
let currentUser = null;

async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    currentUser = data.authenticated ? data.user : null;
    updateNavAuth();
  } catch (e) {
    currentUser = null;
  }
}

function updateNavAuth() {
  const actions = document.querySelector(".nav-actions");
  if (!actions) return;
  if (currentUser) {
    let dashboardUrl = "/student/dashboard";
    if (currentUser.role === "admin") dashboardUrl = "/admin";
    else if (currentUser.role === "coach") dashboardUrl = "/coach/dashboard";
    actions.innerHTML = `
      <span class="nav-user">Hi, <span>${currentUser.name.split(" ")[0]}</span></span>
      <a href="${dashboardUrl}" class="btn-ghost btn-sm">Dashboard</a>
      <button class="btn-primary btn-sm" onclick="logout()">Logout</button>
    `;
  } else {
    actions.innerHTML = `
      <a href="/login" class="btn-ghost btn-sm">Login</a>
      <a href="/register" class="btn-primary btn-sm">Join Now</a>
    `;
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  currentUser = null;
  showToast("Logged out successfully", "success");
  setTimeout(() => (window.location.href = "/"), 1000);
}

// ── Toast ────────────────────────────────────────────────────
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === "success" ? "✓" : "✕"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100px)";
    toast.style.transition = "0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Navbar scroll ────────────────────────────────────────────
window.addEventListener("scroll", () => {
  const nav = document.querySelector("nav");
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
});

// ── Active nav link ──────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === path);
  });
}

// ── Hamburger ────────────────────────────────────────────────
function initHamburger() {
  const btn = document.querySelector(".hamburger");
  const menu = document.querySelector(".mobile-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    menu.classList.toggle("open");
    document.body.style.overflow = menu.classList.contains("open")
      ? "hidden"
      : "";
  });
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      btn.classList.remove("open");
      menu.classList.remove("open");
      document.body.style.overflow = "";
    }),
  );
}

// ── Scroll reveal ────────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          if (e.target.dataset.delay)
            e.target.style.transitionDelay = e.target.dataset.delay;
        }
      });
    },
    { threshold: 0.1 },
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ── API helper ───────────────────────────────────────────────
async function apiCall(url, method = "GET", body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const contentType = res.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || "Request failed");
    }
    throw new Error("Unexpected non-JSON response from server");
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}

// ── Sport badge helper ───────────────────────────────────────
function sportBadge(sport) {
  return `<span class="badge badge-${sport}">${sport.replace("_", " ")}</span>`;
}
function levelBadge(level) {
  return `<span class="badge badge-${level}">${level}</span>`;
}
function sportEmoji(sport) {
  const map = {
    parkour: "🏃",
    calisthenics: "💪",
    rock_climbing: "🧗",
    acrobatics: "🤸",
  };
  return map[sport] || "🏅";
}

// ── Init ─────────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    setActiveNav();
    initHamburger();
    initReveal();
  });
} else {
  // DOM is already loaded (main.js loaded at end of page)
  checkAuth();
  setActiveNav();
  initHamburger();
  initReveal();
}
