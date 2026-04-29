import { authHeaders, getUser, logout, requireLogin } from './auth.js';

const isLoggedIn = requireLogin();
const savedUser = getUser();

const logoutBtn = document.getElementById('logoutBtn');
const message = document.getElementById('message');
const employeeName = document.getElementById('employeeName');
const employeeEmail = document.getElementById('employeeEmail');
const profileAvatar = document.getElementById('profileAvatar');
const editProfileBtn = document.getElementById('editProfileBtn');
const tasksBody = document.getElementById('tasksBody');
const projectsBody = document.getElementById('projectsBody');
const presencesBody = document.getElementById('presencesBody');
const performancesBody = document.getElementById('performancesBody');
const toggleShiftBtn = document.getElementById('toggleShiftBtn');
const presenceStatusText = document.getElementById('presenceStatusText');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

// Modals
const taskModal = document.getElementById('taskModal');
const closeTaskModalBtn = document.getElementById('closeTaskModal');
const taskModalTitle = document.getElementById('taskModalTitle');
const taskModalDescription = document.getElementById('taskModalDescription');
const taskModalStart = document.getElementById('taskModalStart');
const taskModalEnd = document.getElementById('taskModalEnd');
const taskModalStatus = document.getElementById('taskModalStatus');
const taskStatusSelect = document.getElementById('taskStatusSelect');
const saveTaskStatusBtn = document.getElementById('saveTaskStatus');

const projectModal = document.getElementById('projectModal');
const closeProjectModalBtn = document.getElementById('closeProjectModal');
const projectModalTitle = document.getElementById('projectModalTitle');
const projectModalDept = document.getElementById('projectModalDept');
const projectModalBudget = document.getElementById('projectModalBudget');
const projectModalStatus = document.getElementById('projectModalStatus');
const projectModalStart = document.getElementById('projectModalStart');
const projectModalEnd = document.getElementById('projectModalEnd');
const projectModalDescription = document.getElementById('projectModalDescription');

const profileModal = document.getElementById('profileModal');
const closeProfileModalBtn = document.getElementById('closeProfileModal');
const profileForm = document.getElementById('profileForm');
const profileEmail = document.getElementById('profileEmail');
const profilePassword = document.getElementById('profilePassword');
const profilePhoto = document.getElementById('profilePhoto');
const cancelProfileBtn = document.getElementById('cancelProfile');

logoutBtn.addEventListener('click', logout);

if ((savedUser?.role || 'employee') === 'admin') {
  message.textContent = 'You are logged in as admin. This is employee page view.';
}

const state = {
  user: savedUser,
  tasks: [],
  projects: [],
  openPresenceId: null,
  selectedTaskId: null,
  selectedProjectId: null
};

const STATUS_LABELS = {
  not_started: "Didn't start",
  in_progress: 'In progress',
  done: 'Done'
};

function fmtDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function fmtStatus(task) {
  const statusKey = task?.status;
  return STATUS_LABELS[statusKey] || 'In progress';
}

function setEmptyRow(tbody, text, columns) {
  tbody.innerHTML = `<tr><td colspan="${columns}">${text}</td></tr>`;
}

async function fetchMy(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

function toggleModal(modal, open) {
  modal.classList.toggle('hidden', !open);
}

function updateAvatar(url) {
  const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="16" fill="%23e2e8f0"/><circle cx="48" cy="36" r="18" fill="%2394a3b8"/><path d="M16 86c4-18 22-24 32-24s28 6 32 24" fill="%2394a3b8"/></svg>';
  profileAvatar.src = url || fallback;
}

function renderTasksTable() {
  tasksBody.innerHTML = '';
  if (!state.tasks.length) {
    setEmptyRow(tasksBody, 'No tasks found.', 4);
    return;
  }

  state.tasks.forEach((t) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.title || '-'}</td>
      <td>${fmtDate(t.start_date)}</td>
      <td>${fmtDate(t.end_date)}</td>
      <td>${fmtStatus(t)}</td>
    `;
    tr.addEventListener('click', () => openTaskModal(t.id));
    tasksBody.appendChild(tr);
  });
}

function renderProjectsTable() {
  projectsBody.innerHTML = '';
  if (!state.projects.length) {
    setEmptyRow(projectsBody, 'No projects found.', 4);
    return;
  }

  state.projects.forEach((p) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id ?? '-'}</td>
      <td>${p.department_name || '-'}</td>
      <td>${p.budget ?? 0}</td>
      <td>${p.status ? 'Active' : 'Closed'}</td>
    `;
    tr.addEventListener('click', () => openProjectModal(p.id));
    projectsBody.appendChild(tr);
  });
}

async function loadEmployeeHeader() {
  if (!isLoggedIn) {
    message.textContent = 'You are not logged in. Use the Login page if you want to authenticate.';
    employeeName.textContent = 'Guest';
    employeeEmail.textContent = 'No active session';
    updateAvatar(null);
    return;
  }

  try {
    const me = await fetchMy('/api/employees/me');
    state.user = me;
    employeeName.textContent = `${me.first_name || ''} ${me.last_name || ''}`.trim() || 'Employee';
    employeeEmail.textContent = me.email || '';
    updateAvatar(me.photo_url || null);
  } catch (error) {
    message.textContent = error.message;
  }
}

async function loadTasks() {
  if (!isLoggedIn) {
    setEmptyRow(tasksBody, 'Login required.', 4);
    return;
  }

  try {
    state.tasks = await fetchMy('/api/tasks/my');
    renderTasksTable();
  } catch (error) {
    setEmptyRow(tasksBody, error.message, 4);
  }
}

async function loadProjects() {
  if (!isLoggedIn) {
    setEmptyRow(projectsBody, 'Login required.', 4);
    return;
  }

  try {
    state.projects = await fetchMy('/api/projects/my');
    renderProjectsTable();
  } catch (error) {
    setEmptyRow(projectsBody, error.message, 4);
  }
}

async function loadPresences() {
  if (!isLoggedIn) {
    setEmptyRow(presencesBody, 'Login required.', 4);
    updateShiftUi();
    return;
  }

  try {
    const rows = await fetchMy('/api/presences/my');
    const open = rows.find((p) => !p.date_end);
    state.openPresenceId = open?.id || null;
    updateShiftUi(open);
    if (!rows.length) {
      setEmptyRow(presencesBody, 'No presence records found.', 4);
      return;
    }

    presencesBody.innerHTML = rows
      .map((p) => {
        const delayHours = p.delay_min != null ? (Number(p.delay_min) / 60).toFixed(2) : '-';
        return `<tr><td>${fmtDate(p.date_enter)}</td><td>${fmtDate(p.date_end)}</td><td>${p.overtime || '-'}</td><td>${delayHours}</td></tr>`;
      })
      .join('');
  } catch (error) {
    setEmptyRow(presencesBody, error.message, 4);
    updateShiftUi();
  }
}

function updateShiftUi(openPresence) {
  const hasOpen = Boolean(openPresence || state.openPresenceId);
  if (!hasOpen) {
    presenceStatusText.textContent = 'No active shift';
    toggleShiftBtn.textContent = 'Start shift';
    return;
  }

  const openedAt = openPresence?.date_enter;
  presenceStatusText.textContent = openedAt ? `Shift in progress since ${fmtDate(openedAt)}` : 'Shift in progress';
  toggleShiftBtn.textContent = 'End shift';
}

async function startShift() {
  try {
    const created = await fetchMy('/api/presences/my/start', { method: 'POST' });
    state.openPresenceId = created.id;
    message.textContent = 'Shift started.';
    await loadPresences();
  } catch (error) {
    message.textContent = error.message;
  }
}

async function endShift() {
  try {
    await fetchMy('/api/presences/my/end', { method: 'POST' });
    state.openPresenceId = null;
    message.textContent = 'Shift ended.';
    await loadPresences();
  } catch (error) {
    message.textContent = error.message;
  }
}

async function loadPerformances() {
  if (!isLoggedIn) {
    setEmptyRow(performancesBody, 'Login required.', 4);
    return;
  }

  try {
    const rows = await fetchMy('/api/performances/my');
    if (!rows.length) {
      setEmptyRow(performancesBody, 'No performance records found.', 4);
      return;
    }

    performancesBody.innerHTML = rows
      .map((p) => `<tr><td>${p.month_date || '-'}</td><td>${p.augmentation ?? 0}</td><td>${p.tasks_count ?? 0}</td><td>${p.deadlines_met ?? 0}</td></tr>`)
      .join('');
  } catch (error) {
    setEmptyRow(performancesBody, error.message, 4);
  }
}

function openTaskModal(taskId) {
  const task = state.tasks.find((t) => Number(t.id) === Number(taskId));
  if (!task) return;
  state.selectedTaskId = task.id;
  taskModalTitle.textContent = task.title || 'Task Details';
  taskModalDescription.textContent = task.description || 'No description provided.';
  taskModalStart.textContent = fmtDate(task.start_date);
  taskModalEnd.textContent = fmtDate(task.end_date);
  taskModalStatus.textContent = fmtStatus(task);
  taskStatusSelect.value = task.status || 'not_started';
  toggleModal(taskModal, true);
}

function openProjectModal(projectId) {
  const project = state.projects.find((p) => Number(p.id) === Number(projectId));
  if (!project) return;
  state.selectedProjectId = project.id;
  projectModalTitle.textContent = `Project #${project.id}`;
  projectModalDept.textContent = project.department_name || '-';
  projectModalBudget.textContent = project.budget ?? 0;
  projectModalStatus.textContent = project.status ? 'Active' : 'Closed';
  projectModalStart.textContent = fmtDate(project.start_date);
  projectModalEnd.textContent = fmtDate(project.end_date);
  projectModalDescription.textContent = project.description || 'No description provided.';
  toggleModal(projectModal, true);
}

async function saveTaskStatus() {
  if (!state.selectedTaskId) return;
  const status = taskStatusSelect.value;
  try {
    const updated = await fetchMy(`/api/tasks/my/${state.selectedTaskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    const idx = state.tasks.findIndex((t) => Number(t.id) === Number(updated.id));
    if (idx !== -1) state.tasks[idx] = updated;
    renderTasksTable();
    toggleModal(taskModal, false);
    message.textContent = 'Task status updated.';
  } catch (error) {
    message.textContent = error.message;
  }
}

function openProfileModal() {
  if (!state.user) return;
  profileEmail.value = state.user.email || '';
  profilePassword.value = '';
  profilePhoto.value = state.user.photo_url || '';
  toggleModal(profileModal, true);
}

async function saveProfile(event) {
  event.preventDefault();
  if (!state.user) return;

  const payload = {
    email: profileEmail.value || null,
    password_hash: profilePassword.value || null,
    photo_url: profilePhoto.value || null
  };

  // Remove blank fields so we do not overwrite with null unintentionally
  Object.keys(payload).forEach((key) => {
    if (!payload[key]) delete payload[key];
  });

  try {
    const updated = await fetchMy('/api/employees/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    state.user = { ...state.user, ...updated };
    localStorage.setItem('auth_user', JSON.stringify(state.user));
    employeeEmail.textContent = state.user.email || '';
    updateAvatar(state.user.photo_url || null);
    toggleModal(profileModal, false);
    message.textContent = 'Profile updated.';
  } catch (error) {
    message.textContent = error.message;
  }
}

// Tabs
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    tabPanels.forEach((p) => p.classList.remove('active'));

    btn.classList.add('active');
    const tab = btn.dataset.tab;
    const panel = document.getElementById(`tab-${tab}`);
    if (panel) panel.classList.add('active');
  });
});

closeTaskModalBtn.addEventListener('click', () => toggleModal(taskModal, false));
closeProjectModalBtn.addEventListener('click', () => toggleModal(projectModal, false));
closeProfileModalBtn.addEventListener('click', () => toggleModal(profileModal, false));
cancelProfileBtn.addEventListener('click', () => toggleModal(profileModal, false));
saveTaskStatusBtn.addEventListener('click', saveTaskStatus);
editProfileBtn.addEventListener('click', openProfileModal);
profileForm.addEventListener('submit', saveProfile);
toggleShiftBtn.addEventListener('click', () => {
  if (!isLoggedIn) return;
  if (state.openPresenceId) {
    endShift();
  } else {
    startShift();
  }
});

// Initial load
loadEmployeeHeader();
loadTasks();
loadProjects();
loadPresences();
loadPerformances();
