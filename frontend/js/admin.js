import { authHeaders, getUser, logout, requireLogin } from './auth.js';

const isLoggedIn = requireLogin();
const user = getUser();

const logoutBtn = document.getElementById('logoutBtn');
const message = document.getElementById('message');
const employeesTableBody = document.getElementById('employeesTableBody');
const detailName = document.getElementById('detailName');
const detailEmail = document.getElementById('detailEmail');
const detailRole = document.getElementById('detailRole');
const detailCreated = document.getElementById('detailCreated');
const detailAvatar = document.getElementById('detailAvatar');
const tasksBody = document.getElementById('tasksBody');
const projectsBody = document.getElementById('projectsBody');
const projectsMemberBody = document.getElementById('projectsMemberBody');
const presenceBody = document.getElementById('presenceBody');
const tasksAllBody = document.getElementById('tasksAllBody');
const employeeSearch = document.getElementById('employeeSearch');
// task creation moved to create-task page

const projectsAllBody = document.getElementById('projectsAllBody');
const projectDetailName = document.getElementById('projectDetailName');
const projectDetailDept = document.getElementById('projectDetailDept');
const projectDetailBudget = document.getElementById('projectDetailBudget');
const projectDetailStatus = document.getElementById('projectDetailStatus');
const projectDetailStart = document.getElementById('projectDetailStart');
const projectDetailEnd = document.getElementById('projectDetailEnd');
const projectDetailOwner = document.getElementById('projectDetailOwner');
const projectDetailDescription = document.getElementById('projectDetailDescription');
const projectAssignmentsBody = document.getElementById('projectAssignmentsBody');
const projectAssignForm = document.getElementById('projectAssignForm');
const projectAssignSelect = document.getElementById('projectAssignSelect');
const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
const adminTabPanels = document.querySelectorAll('.admin-tab');

logoutBtn.addEventListener('click', logout);

function switchTab(tab) {
  adminTabBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
  adminTabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${tab}`));
}

adminTabBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

if ((user?.role || 'employee') !== 'admin') {
  message.textContent = 'Admin role required to view this page.';
}

const state = {
  employees: [],
  filteredEmployees: [],
  projects: [],
  tasks: [],
  presences: [],
  employeeProjects: [],
  selectedEmployeeId: null,
  selectedProjectId: null
};

const STATUS_LABELS = {
  not_started: "Didn't start",
  in_progress: 'In progress',
  done: 'Done'
};

const FALLBACK_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110"><rect width="110" height="110" rx="12" fill="%23e2e8f0"/><circle cx="55" cy="42" r="22" fill="%2394a3b8"/><path d="M22 102c4-20 26-28 33-28s29 8 33 28" fill="%2394a3b8"/></svg>';

function fmtStatus(task) {
  const key = task?.status;
  return STATUS_LABELS[key] || 'In progress';
}

function fmtDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function fmtDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function fmtDelayHours(delayMin) {
  if (delayMin == null) return '-';
  return (Number(delayMin) / 60).toFixed(2);
}

async function fetchJson(url, options = {}) {
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

function renderEmployees() {
  employeesTableBody.innerHTML = '';
  const list = state.filteredEmployees.length ? state.filteredEmployees : state.employees;
  list.forEach((employee) => {
    const tr = document.createElement('tr');
    tr.classList.toggle('active', employee.id === state.selectedEmployeeId);
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
    tr.innerHTML = `
      <td>${employee.id ?? '-'}</td>
      <td>${fullName || '-'}</td>
      <td>${employee.email || '-'}</td>
      <td>${employee.role || 'employee'}</td>
    `;
    tr.addEventListener('click', () => selectEmployee(employee.id));
    employeesTableBody.appendChild(tr);
  });
}

function renderEmployeeDetails() {
  const emp = state.employees.find((e) => e.id === state.selectedEmployeeId);
  if (!emp) {
    detailName.textContent = 'Select an employee';
    detailEmail.textContent = '-';
    detailRole.textContent = '-';
    detailCreated.textContent = '-';
    detailAvatar.src = FALLBACK_AVATAR;
    tasksBody.innerHTML = '';
    projectsBody.innerHTML = '';
    presenceBody.innerHTML = '';
    return;
  }

  detailName.textContent = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Employee';
  detailEmail.textContent = emp.email || '-';
  detailRole.textContent = emp.role || 'employee';
  detailCreated.textContent = emp.created_at ? new Date(emp.created_at).toLocaleString() : '-';
  detailAvatar.src = emp.photo_url || FALLBACK_AVATAR;

  const tasks = state.tasks.filter((t) => Number(t.employee_id) === Number(emp.id));
  tasksBody.innerHTML = tasks.length
    ? tasks
        .map(
          (t) => `
        <tr>
          <td>${t.title || '-'}</td>
          <td>${fmtDate(t.start_date)}</td>
          <td>${fmtDate(t.end_date)}</td>
          <td>${fmtStatus(t)}</td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="4">No tasks yet.</td></tr>';

  const ownedProjects = state.projects.filter((p) => Number(p.employee_id) === Number(emp.id));
  projectsBody.innerHTML = ownedProjects.length
    ? ownedProjects
        .map(
          (p) => `
        <tr>
          <td>${p.id ?? '-'}</td>
          <td>${p.department_name || '-'}</td>
          <td>${p.budget ?? 0}</td>
          <td>${p.status ? 'Active' : 'Closed'}</td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="4">No projects yet.</td></tr>';

  const memberProjects = state.employeeProjects
    .filter((ep) => Number(ep.employee_id) === Number(emp.id))
    .map((ep) => state.projects.find((p) => Number(p.id) === Number(ep.project_id)))
    .filter(Boolean);

  projectsMemberBody.innerHTML = memberProjects.length
    ? memberProjects
        .map((p) => {
          const owner = state.employees.find((e) => Number(e.id) === Number(p.employee_id));
          const ownerName = owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() : p.employee_id;
          return `<tr><td>${p.id ?? '-'}</td><td>${p.department_name || '-'}</td><td>${ownerName || '-'}</td><td>${p.status ? 'Active' : 'Closed'}</td></tr>`;
        })
        .join('')
    : '<tr><td colspan="4">Not assigned to any projects.</td></tr>';

  const presenceRows = state.presences.filter((p) => Number(p.employee_id) === Number(emp.id));
  presenceBody.innerHTML = presenceRows.length
    ? presenceRows
      .map((p) => `<tr><td>${fmtDateTime(p.date_enter)}</td><td>${fmtDateTime(p.date_end)}</td><td>${p.overtime ?? '-'}</td><td>${fmtDelayHours(p.delay_min)}</td></tr>`)
        .join('')
    : '<tr><td colspan="4">No presence records.</td></tr>';
}

function populateProjectSelect() {
  projectAssignSelect.innerHTML = '<option value="">Choose employee</option>';
  state.employees.forEach((emp) => {
    const opt = document.createElement('option');
    opt.value = emp.id;
    opt.textContent = `${emp.id} — ${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    projectAssignSelect.appendChild(opt);
  });
}

async function loadEmployees() {
  const data = await fetchJson('/api/employees');
  state.employees = data;
  state.filteredEmployees = data;

  renderEmployees();
  if (!state.selectedEmployeeId && state.employees.length) {
    state.selectedEmployeeId = state.employees[0].id;
    renderEmployeeDetails();
  }
}

async function loadProjects() {
  const data = await fetchJson('/api/projects');
  state.projects = data;
  renderProjectsList();
  renderEmployeeDetails();
  if (!state.selectedProjectId && state.projects.length) {
    state.selectedProjectId = state.projects[0].id;
    renderProjectDetails();
  }
}

async function loadTasks() {
  const data = await fetchJson('/api/tasks');
  state.tasks = data;
  renderEmployeeDetails();
  renderTasksList();
}

async function loadPresences() {
  const data = await fetchJson('/api/presences');
  state.presences = data;
  renderEmployeeDetails();
}

async function loadEmployeeProjects() {
  const data = await fetchJson('/api/employee-projects');
  state.employeeProjects = data;
  renderProjectDetails();
  renderEmployeeDetails();
}

function selectEmployee(id) {
  state.selectedEmployeeId = id;
  renderEmployees();
  renderEmployeeDetails();
}

function renderTasksList() {
  tasksAllBody.innerHTML = '';
  if (!state.tasks.length) {
    tasksAllBody.innerHTML = '<tr><td colspan="5">No tasks yet.</td></tr>';
    return;
  }

  state.tasks.forEach((t) => {
    const emp = state.employees.find((e) => Number(e.id) === Number(t.employee_id));
    const name = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : t.employee_id ?? '-';
    tasksAllBody.innerHTML += `
      <tr>
        <td>${t.title || '-'}</td>
        <td>${name || '-'}</td>
        <td>${fmtDate(t.start_date)}</td>
        <td>${fmtDate(t.end_date)}</td>
        <td>${fmtStatus(t)}</td>
      </tr>`;
  });
}

async function createTask(event) {
  event.preventDefault();
}

function renderProjectsList() {
  projectsAllBody.innerHTML = '';
  state.projects.forEach((p) => {
    const tr = document.createElement('tr');
    tr.classList.toggle('active', p.id === state.selectedProjectId);
    const owner = state.employees.find((e) => Number(e.id) === Number(p.employee_id));
    const ownerName = owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() : '-';
    tr.innerHTML = `
      <td>${p.id ?? '-'}</td>
      <td>${p.department_name || '-'}</td>
      <td>${ownerName || '-'}</td>
      <td>${p.status ? 'Active' : 'Closed'}</td>
    `;
    tr.addEventListener('click', () => selectProject(p.id));
    projectsAllBody.appendChild(tr);
  });
}

function renderProjectDetails() {
  const project = state.projects.find((p) => p.id === state.selectedProjectId);
  const owner = project ? state.employees.find((e) => Number(e.id) === Number(project.employee_id)) : null;

  if (!project) {
    projectDetailName.textContent = 'Select a project';
    projectDetailDept.textContent = '-';
    projectDetailBudget.textContent = '-';
    projectDetailStatus.textContent = '-';
    projectDetailStart.textContent = '-';
    projectDetailEnd.textContent = '-';
    projectDetailOwner.textContent = '-';
    projectDetailDescription.textContent = '-';
    projectAssignmentsBody.innerHTML = '<tr><td colspan="4">No project selected.</td></tr>';
    return;
  }

  projectDetailName.textContent = `Project #${project.id}`;
  projectDetailDept.textContent = project.department_name || '-';
  projectDetailBudget.textContent = project.budget ?? '-';
  projectDetailStatus.textContent = project.status ? 'Active' : 'Closed';
  projectDetailStart.textContent = fmtDate(project.start_date);
  projectDetailEnd.textContent = fmtDate(project.end_date);
  projectDetailOwner.textContent = owner
    ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email
    : project.employee_id || '-';
  projectDetailDescription.textContent = project.description || 'No description provided.';

  const assignments = state.employeeProjects.filter((ep) => Number(ep.project_id) === Number(project.id));
  if (!assignments.length) {
    projectAssignmentsBody.innerHTML = '<tr><td colspan="4">No employees assigned.</td></tr>';
  } else {
    projectAssignmentsBody.innerHTML = assignments
      .map((ep) => {
        const emp = state.employees.find((e) => Number(e.id) === Number(ep.employee_id));
        const name = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : '-';
        const email = emp?.email || '-';
        const role = emp?.role || 'employee';
        return `<tr><td>${ep.employee_id}</td><td>${name}</td><td>${email}</td><td>${role}</td></tr>`;
      })
      .join('');
  }
}

function selectProject(id) {
  state.selectedProjectId = id;
  renderProjectsList();
  renderProjectDetails();
}

async function assignInProjectPanel(event) {
  event.preventDefault();
  if (!state.selectedProjectId) {
    message.textContent = 'Select a project first.';
    return;
  }

  const employeeId = projectAssignSelect.value;
  if (!employeeId) {
    message.textContent = 'Choose an employee to assign.';
    return;
  }

  try {
    await fetchJson('/api/employee-projects', {
      method: 'POST',
      body: JSON.stringify({ project_id: Number(state.selectedProjectId), employee_id: Number(employeeId) })
    });

    message.textContent = 'Employee assigned to project.';
    await loadEmployeeProjects();
  } catch (error) {
    message.textContent = error.message;
  }
}

employeeSearch?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase().trim();
  if (!term) {
    state.filteredEmployees = state.employees;
  } else {
    state.filteredEmployees = state.employees.filter((emp) => {
      const name = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
      return name.includes(term) || (emp.email || '').toLowerCase().includes(term);
    });
  }

  renderEmployees();
});

async function init() {
  if (!isLoggedIn) {
    message.textContent = 'You are not logged in. Use the Login page if you want to authenticate.';
    return;
  }

  if ((user?.role || 'employee') !== 'admin') {
    message.textContent = 'Admin role required to view this page.';
    return;
  }

  try {
    await loadEmployees();
    populateProjectSelect();
    await Promise.all([loadProjects(), loadTasks(), loadEmployeeProjects(), loadPresences()]);
    populateProjectSelect();
  } catch (error) {
    message.textContent = error.message;
  }
}
// task creation handled on create-task page
projectAssignForm.addEventListener('submit', assignInProjectPanel);

init();
