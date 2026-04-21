const API = "/api";

// ── Auth guard ────────────────────────────────────────────────
(function() {
  const token = localStorage.getItem('h404_token');
  const role  = localStorage.getItem('h404_role');
  if (!token || role !== 'admin') { window.location.href = '/login'; }
})();

function authFetch(url, options = {}) {
  const token = localStorage.getItem('h404_token');
  options.headers = { ...(options.headers||{}), 'Authorization': `Bearer ${token}` };
  return fetch(url, options);
}

document.addEventListener("DOMContentLoaded", () => {

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const tbody           = document.querySelector("tbody");
  const searchInput     = document.querySelector(".search");
  const btnAdd          = document.getElementById("btnAdd");
  const btnRemove       = document.getElementById("btnRemove");
  const modalForm       = document.querySelector(".modal-form");
  const alertOverlay    = document.getElementById("customAlert");
  const alertMessage    = document.getElementById("alertMessage");
  const alertOkBtn      = alertOverlay.querySelector(".ok-btn");
  const alertCancelBtn  = alertOverlay.querySelector(".cancel-btn");

  // ── Modal open / close ───────────────────────────────────────────────────
  const openModal  = id => document.getElementById(id).classList.add("active");
  const closeModal = id => document.getElementById(id).classList.remove("active");

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  // ── Custom confirm ────────────────────────────────────────────────────────
  let confirmCallback = null;

  function showConfirm(message, onOk) {
    alertMessage.textContent   = message;
    alertOverlay.style.display = "flex";
    confirmCallback = onOk;
  }

  alertOkBtn.addEventListener("click", () => {
    alertOverlay.style.display = "none";
    if (confirmCallback) { confirmCallback(); confirmCallback = null; }
  });

  alertCancelBtn.addEventListener("click", () => {
    alertOverlay.style.display = "none";
    confirmCallback = null;
  });

  // ── Hamburger ─────────────────────────────────────────────────────────────
  const hamburger = document.getElementById("hamburger");
  const navLinks  = document.getElementById("navLinks");
  if (hamburger) hamburger.addEventListener("click", () => navLinks.classList.toggle("active"));

  // ── ••• dot menu ──────────────────────────────────────────────────────────
  document.addEventListener("click", e => {
    const dotBtn     = e.target.closest(".actions-btn");
    const insideMenu = e.target.closest(".actions-menu");

    if (!dotBtn && !insideMenu) {
      document.querySelectorAll(".actions-menu.active").forEach(m => m.classList.remove("active"));
      return;
    }

    if (dotBtn) {
      const menu   = dotBtn.nextElementSibling;
      const isOpen = menu.classList.contains("active");
      document.querySelectorAll(".actions-menu.active").forEach(m => m.classList.remove("active"));
      if (!isOpen) menu.classList.add("active");
    }
  });

  // ── Row actions via event delegation ─────────────────────────────────────
  tbody.addEventListener("click", async e => {
    const row = e.target.closest("tr");
    if (!row) return;

    const id   = row.dataset.id;
    const name = row.cells[2]?.textContent;

    // Delete
    if (e.target.classList.contains("delete")) {
      document.querySelectorAll(".actions-menu.active").forEach(m => m.classList.remove("active"));
      showConfirm(`Delete ${name}?`, async () => {
        try {
          const res  = await authFetch(`${API}/users/${id}`, { method: "DELETE" });
          const data = await res.json();
          res.ok ? (showToast(`🗑️ ${name} deleted`), loadUsers(), loadStats())
                 : showToast("❌ " + data.error, "red");
        } catch { showToast("❌ Server not reachable", "red"); }
      });
      return;
    }

    // Disable / Enable
    if (e.target.classList.contains("disable")) {
      document.querySelectorAll(".actions-menu.active").forEach(m => m.classList.remove("active"));
      try {
        const res  = await authFetch(`${API}/users/${id}/disable`, { method: "PATCH" });
        const data = await res.json();
        res.ok ? (showToast(`🔄 ${name} set to ${data.status}`), loadUsers(), loadStats())
               : showToast("❌ " + data.error, "red");
      } catch { showToast("❌ Server not reachable", "red"); }
      return;
    }

    // Edit
    if (e.target.classList.contains("edit")) {
      document.querySelectorAll(".actions-menu.active").forEach(m => m.classList.remove("active"));
      const role   = row.cells[3].textContent;
      const status = row.cells[4].querySelector(".status").textContent.trim();

      modalForm.querySelector("input[type='text']").value = name;
      modalForm.querySelectorAll("select")[0].value       = role;
      modalForm.querySelectorAll("select")[1].value       = status;

      // Hide email and password when editing
      document.getElementById("emailGroup").style.display    = "none";
      document.getElementById("passwordGroup").style.display = "none";
      modalForm.querySelector("input[type='email']").removeAttribute("required");
      document.getElementById("userPassword").removeAttribute("required");

      modalForm.dataset.editId = id;
      document.querySelector("#addUserModal h3").textContent       = "Edit User";
      document.querySelector("#addUserModal .btn-add").textContent = "Save Changes";
      openModal("addUserModal");
      return;
    }
  });

  // ── Add User ──────────────────────────────────────────────────────────────
  btnAdd.addEventListener("click", () => { resetForm(); openModal("confirmAddUser"); });

  document.getElementById("confirmContinue").addEventListener("click", () => {
    closeModal("confirmAddUser"); openModal("addUserModal");
  });

  document.getElementById("cancelConfirm").addEventListener("click", () => closeModal("confirmAddUser"));

  document.querySelector("#addUserModal .btn-cancel").addEventListener("click", () => {
    resetForm(); closeModal("addUserModal");
  });

  // ── Bulk Remove ───────────────────────────────────────────────────────────
  btnRemove.addEventListener("click", () => {
    const checked = [...document.querySelectorAll("tbody input[type='checkbox']:checked")];
    if (!checked.length) { showToast("⚠️ No users selected", "#f59e0b"); return; }
    const ids = checked.map(cb => cb.closest("tr").dataset.id);
    showConfirm(`Delete ${ids.length} selected user(s)?`, async () => {
      for (const id of ids) await authFetch(`${API}/users/${id}`, { method: "DELETE" });
      showToast(`🗑️ ${ids.length} user(s) deleted`);
      loadUsers(); loadStats();
    });
  });

  // ── Search ────────────────────────────────────────────────────────────────
  searchInput.addEventListener("input", e => loadUsers(e.target.value));

  // ── Form submit ───────────────────────────────────────────────────────────
  modalForm.addEventListener("submit", async e => {
    e.preventDefault();
    const editId   = modalForm.dataset.editId;
    const name     = modalForm.querySelector("input[type='text']").value.trim();
    const email    = modalForm.querySelector("input[type='email']").value.trim();
    const password = document.getElementById("userPassword").value;
    const role     = modalForm.querySelectorAll("select")[0].value;
    const status   = modalForm.querySelectorAll("select")[1].value;

    // Edit mode
    if (editId) {
      try {
        const res  = await authFetch(`${API}/users/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, role, status }),
        });
        const data = await res.json();
        if (res.ok) { showToast("✅ User updated"); resetForm(); closeModal("addUserModal"); loadUsers(); loadStats(); }
        else showToast("❌ " + data.error, "red");
      } catch { showToast("❌ Server not reachable", "red"); }
      return;
    }

    // Add mode
    if (!name || !email || !password || !role) { showToast("⚠️ All fields are required", "#f59e0b"); return; }
    try {
      const res  = await authFetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, status }),
      });
      const data = await res.json();
      if (res.ok) { showToast(`✅ ${name} added!`); resetForm(); closeModal("addUserModal"); loadUsers(); loadStats(); }
      else showToast("❌ " + (data.error || "Failed"), "red");
    } catch { showToast("❌ Server not reachable", "red"); }
  });

  // ── Reset form ────────────────────────────────────────────────────────────
  function resetForm() {
    modalForm.reset();
    delete modalForm.dataset.editId;
    document.getElementById("emailGroup").style.display    = "block";
    document.getElementById("passwordGroup").style.display = "block";
    modalForm.querySelector("input[type='email']").setAttribute("required", "");
    document.getElementById("userPassword").setAttribute("required", "");
    document.querySelector("#addUserModal h3").textContent       = "Add New User";
    document.querySelector("#addUserModal .btn-add").textContent = "Add User";
  }

  // ── Load stats ────────────────────────────────────────────────────────────
  async function loadStats() {
    try {
      const data = await authFetch(`${API}/stats`).then(r => r.json());
      document.querySelector(".stat-card.users h2").textContent     = data.total;
      document.querySelector(".stat-card.patient h2").textContent   = data.patients;
      document.querySelector(".stat-card.clinician h2").textContent = data.clinicians;
    } catch (err) { console.error("Stats error:", err); }
  }

  // ── Load users ────────────────────────────────────────────────────────────
  async function loadUsers(search = "") {
    try {
      const url   = search ? `${API}/users?search=${encodeURIComponent(search)}` : `${API}/users`;
      const users = await authFetch(url).then(r => r.json());
      tbody.innerHTML = "";
      users.forEach(user => {
        const badge = user.status === "Active"
          ? `<span class="status active">Active</span>`
          : `<span class="status disabled">Disabled</span>`;
        const tr = document.createElement("tr");
        tr.dataset.id = user.id;
        tr.innerHTML = `
          <td><input type="checkbox"></td>
          <td>${String(user.id).padStart(3, "0")}</td>
          <td>${user.name}</td>
          <td>${user.role}</td>
          <td>${badge}</td>
          <td class="actions-cell">
            <button class="actions-btn">•••</button>
            <div class="actions-menu">
              <button class="action edit">Edit</button>
              <button class="action disable">${user.status === "Active" ? "Disable" : "Enable"}</button>
              <button class="action delete">Delete</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      });
    } catch (err) { console.error("Users error:", err); }
  }

  // ── System load circles ───────────────────────────────────────────────────
  let systemLoadInitialised = false;

  async function loadSystemLoad() {
    try {
      const data = await authFetch(`${API}/system`).then(r => r.json());
      const map  = { cpu: data.cpu, ram: data.ram, storage: data.storage };

      document.querySelectorAll(".circle").forEach(circle => {
        const key    = [...circle.classList].find(c => map[c] !== undefined);
        const target = map[key] ?? 0;
        const label  = circle.querySelector("span");

        if (!systemLoadInitialised) {
          let current = 0;
          circle.style.setProperty("--value", 0);
          label.textContent = "0%";
          const tick = () => {
            if (current <= target) {
              circle.style.setProperty("--value", current);
              label.textContent = `${current}%`;
              current++;
              setTimeout(tick, 15);
            }
          };
          tick();
        } else {
          circle.style.setProperty("--value", target);
          label.textContent = `${target}%`;
        }
      });

      systemLoadInitialised = true;

      // Update system info panel
      const uptimeEl  = document.getElementById("sysUptime");
      const serverEl  = document.getElementById("sysServer");
      const dbEl      = document.getElementById("sysDb");
      const backupEl  = document.getElementById("sysBackup");

      if (uptimeEl) uptimeEl.textContent  = `✔ System Uptime: ${data.uptime}`;
      if (serverEl) serverEl.textContent  = `✔ Server Status: ${data.serverStatus}`;
      if (dbEl)     dbEl.textContent      = `${data.dbStatus === 'Normal' ? '✔' : '❌'} Database Status: ${data.dbStatus}`;
      if (backupEl) backupEl.textContent  = `⏱ Last Backup: ${data.lastBackup}`;

    } catch (err) { console.error("System load error:", err); }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(msg, color = "#10b981") {
    const toast = document.createElement("div");
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: "fixed", bottom: "28px", right: "28px",
      background: color === "red" ? "#ef4444" : color,
      color: "#fff", padding: "12px 22px", borderRadius: "10px",
      fontSize: "14px", fontWeight: "600",
      boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
      zIndex: "9999", opacity: "0", transition: "opacity 0.3s ease",
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = "1");
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 400); }, 3000);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  loadStats();
  loadUsers();
  loadSystemLoad();
  setInterval(loadSystemLoad, 5000);
});