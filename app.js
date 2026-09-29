// PulseFit frontend - talks to the backend only through the API Gateway
// (never directly to a microservice), at the address set in config.js.

document.getElementById("gatewayUrl").textContent = API_BASE_URL;

// ---------- small helpers ----------

function showToast(message, isError) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast" + (isError ? " error" : "");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 4000);
}

async function api(path, options) {
  const res = await fetch(API_BASE_URL + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.message || detail;
    } catch (_) { /* no JSON body */ }
    throw new Error(`${res.status}: ${detail}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function fmtDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ---------- tabs ----------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

// ---------- gateway health check ----------

async function checkGateway() {
  const el = document.getElementById("gatewayStatus");
  try {
    const res = await fetch(API_BASE_URL + "/actuator/health");
    if (res.ok) {
      el.textContent = "gateway online";
      el.className = "gateway-status up";
    } else {
      throw new Error("not ok");
    }
  } catch (_) {
    el.textContent = "gateway unreachable — update config.js";
    el.className = "gateway-status down";
  }
}

// ---------- members ----------

let membersCache = [];

async function loadMembers() {
  const body = document.getElementById("membersBody");
  try {
    membersCache = await api("/api/members");
    if (membersCache.length === 0) {
      body.innerHTML = `<tr><td colspan="6" class="empty">No members yet</td></tr>`;
    } else {
      body.innerHTML = membersCache.map(renderMemberRow).join("");
    }
    populateMemberSelect();
  } catch (err) {
    body.innerHTML = `<tr><td colspan="6" class="empty">Could not load members (${escapeHtml(err.message)})</td></tr>`;
  }
}

function renderMemberRow(m) {
  return `
    <tr data-id="${m.id}">
      <td>
        ${m.photoUrl ? `<img class="avatar" src="${escapeHtml(m.photoUrl)}" alt="">` : `<span class="avatar"></span>`}
        <label class="upload-label">
          ${m.photoUrl ? "change" : "upload"}
          <input type="file" accept="image/*" style="display:none" onchange="uploadMemberPhoto(${m.id}, this.files[0])">
        </label>
      </td>
      <td>${escapeHtml(m.fullName)}</td>
      <td>${escapeHtml(m.email)}</td>
      <td>${escapeHtml(m.membershipPlan)}</td>
      <td>${escapeHtml(m.joinDate)}</td>
      <td><button class="row-action danger" onclick="deleteMember(${m.id})">Delete</button></td>
    </tr>`;
}

document.getElementById("memberForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = Object.fromEntries(new FormData(form).entries());
  if (!payload.joinDate) delete payload.joinDate;
  try {
    await api("/api/members", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    showToast("Member added");
    loadMembers();
  } catch (err) {
    showToast("Could not add member: " + err.message, true);
  }
});

async function deleteMember(id) {
  if (!confirm("Delete this member?")) return;
  try {
    await api(`/api/members/${id}`, { method: "DELETE" });
    showToast("Member deleted");
    loadMembers();
  } catch (err) {
    showToast("Could not delete member: " + err.message, true);
  }
}

async function uploadMemberPhoto(id, file) {
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch(`${API_BASE_URL}/api/members/${id}/photo`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(res.statusText);
    showToast("Photo uploaded to Cloud Storage");
    loadMembers();
  } catch (err) {
    showToast("Photo upload failed: " + err.message, true);
  }
}

document.getElementById("refreshMembers").addEventListener("click", loadMembers);

// ---------- classes ----------

let classesCache = [];

async function loadClasses() {
  const body = document.getElementById("classesBody");
  try {
    classesCache = await api("/api/classes");
    if (classesCache.length === 0) {
      body.innerHTML = `<tr><td colspan="6" class="empty">No classes yet</td></tr>`;
    } else {
      body.innerHTML = classesCache.map(renderClassRow).join("");
    }
    populateClassSelect();
  } catch (err) {
    body.innerHTML = `<tr><td colspan="6" class="empty">Could not load classes (${escapeHtml(err.message)})</td></tr>`;
  }
}

function renderClassRow(c) {
  return `
    <tr data-id="${c.id}">
      <td>${escapeHtml(c.className)}</td>
      <td>${escapeHtml(c.category)}</td>
      <td>${escapeHtml(c.trainerName)}</td>
      <td>${fmtDateTime(c.scheduleTime)}</td>
      <td>${escapeHtml(c.capacity)}</td>
      <td><button class="row-action danger" onclick="deleteClass(${c.id})">Delete</button></td>
    </tr>`;
}

document.getElementById("classForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.durationMinutes = Number(payload.durationMinutes);
  payload.capacity = Number(payload.capacity);
  try {
    await api("/api/classes", { method: "POST", body: JSON.stringify(payload) });
    form.reset();
    showToast("Class added");
    loadClasses();
  } catch (err) {
    showToast("Could not add class: " + err.message, true);
  }
});

async function deleteClass(id) {
  if (!confirm("Delete this class?")) return;
  try {
    await api(`/api/classes/${id}`, { method: "DELETE" });
    showToast("Class deleted");
    loadClasses();
  } catch (err) {
    showToast("Could not delete class: " + err.message, true);
  }
}

document.getElementById("refreshClasses").addEventListener("click", loadClasses);

// ---------- bookings ----------

async function loadBookings() {
  const body = document.getElementById("bookingsBody");
  try {
    const bookings = await api("/api/bookings");
    if (bookings.length === 0) {
      body.innerHTML = `<tr><td colspan="5" class="empty">No bookings yet</td></tr>`;
    } else {
      body.innerHTML = bookings.map(renderBookingRow).join("");
    }
  } catch (err) {
    body.innerHTML = `<tr><td colspan="5" class="empty">Could not load bookings (${escapeHtml(err.message)})</td></tr>`;
  }
}

function renderBookingRow(b) {
  const canCancel = b.status === "CONFIRMED";
  return `
    <tr data-id="${b.id}">
      <td>${escapeHtml(b.memberName)}</td>
      <td>${escapeHtml(b.className)}</td>
      <td>${fmtDateTime(b.scheduleTime)}</td>
      <td><span class="status-pill status-${b.status}">${escapeHtml(b.status)}</span></td>
      <td>
        ${canCancel ? `<button class="row-action accent" onclick="cancelBooking('${b.id}')">Cancel</button>` : ""}
        <button class="row-action danger" onclick="deleteBooking('${b.id}')">Delete</button>
      </td>
    </tr>`;
}

function populateMemberSelect() {
  const select = document.getElementById("bookingMemberSelect");
  select.innerHTML = membersCache.length
    ? membersCache.map((m) => `<option value="${m.id}">${escapeHtml(m.fullName)}</option>`).join("")
    : `<option value="">No members yet</option>`;
}

function populateClassSelect() {
  const select = document.getElementById("bookingClassSelect");
  select.innerHTML = classesCache.length
    ? classesCache.map((c) => `<option value="${c.id}">${escapeHtml(c.className)} — ${fmtDateTime(c.scheduleTime)}</option>`).join("")
    : `<option value="">No classes yet</option>`;
}

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = Object.fromEntries(new FormData(form).entries());
  if (!payload.memberId || !payload.classId) {
    showToast("Add a member and a class first", true);
    return;
  }
  payload.memberId = Number(payload.memberId);
  payload.classId = Number(payload.classId);
  try {
    await api("/api/bookings", { method: "POST", body: JSON.stringify(payload) });
    showToast("Booking confirmed");
    loadBookings();
  } catch (err) {
    showToast("Could not create booking: " + err.message, true);
  }
});

async function cancelBooking(id) {
  try {
    await api(`/api/bookings/${id}/cancel`, { method: "PUT" });
    showToast("Booking cancelled");
    loadBookings();
  } catch (err) {
    showToast("Could not cancel booking: " + err.message, true);
  }
}

async function deleteBooking(id) {
  if (!confirm("Delete this booking?")) return;
  try {
    await api(`/api/bookings/${id}`, { method: "DELETE" });
    showToast("Booking deleted");
    loadBookings();
  } catch (err) {
    showToast("Could not delete booking: " + err.message, true);
  }
}

document.getElementById("refreshBookings").addEventListener("click", loadBookings);

// ---------- boot ----------

checkGateway();
loadMembers();
loadClasses();
loadBookings();
