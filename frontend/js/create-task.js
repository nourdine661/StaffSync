import { authHeaders, getUser, requireLogin } from './auth.js';

const isLoggedIn = requireLogin();
const user = getUser();

const form = document.getElementById('createTaskForm');
const ctTitle = document.getElementById('ctTitle');
const ctDesc = document.getElementById('ctDesc');
const ctStart = document.getElementById('ctStart');
const ctEnd = document.getElementById('ctEnd');
const ctEmployeeSelect = document.getElementById('ctEmployeeSelect');
const ctAddEmployee = document.getElementById('ctAddEmployee');
const ctSelectedList = document.getElementById('ctSelectedList');
const ctMessage = document.getElementById('ctMessage');

// Store selected employees by id for easy add/remove without duplicates
const selectedEmployees = new Map();

if (!isLoggedIn || (user?.role || 'employee') !== 'admin') {
  ctMessage.textContent = 'Admin login required to create tasks.';
  form?.addEventListener('submit', (e) => e.preventDefault());
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

async function loadEmployees() {
  try {
    const employees = await fetchJson('/api/employees');
    ctEmployeeSelect.innerHTML = '<option value="">Choose employee</option>';
    employees.forEach((emp) => {
      const opt = document.createElement('option');
      opt.value = emp.id;
      opt.textContent = `${emp.id} — ${emp.first_name || ''} ${emp.last_name || ''}`.trim();
      ctEmployeeSelect.appendChild(opt);
    });
  } catch (error) {
    ctMessage.textContent = error.message;
  }
}

function renderSelected() {
  ctSelectedList.innerHTML = '';
  if (!selectedEmployees.size) {
    ctSelectedList.textContent = 'No employees selected.';
    return;
  }

  selectedEmployees.forEach((name, id) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = name;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.className = 'chip-remove';
    btn.addEventListener('click', () => {
      selectedEmployees.delete(id);
      renderSelected();
    });

    chip.appendChild(btn);
    ctSelectedList.appendChild(chip);
  });
}

ctAddEmployee.addEventListener('click', () => {
  const id = ctEmployeeSelect.value;
  if (!id) return;
  const name = ctEmployeeSelect.options[ctEmployeeSelect.selectedIndex].textContent;
  selectedEmployees.set(id, name);
  ctEmployeeSelect.value = '';
  renderSelected();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isLoggedIn || (user?.role || 'employee') !== 'admin') return;

  const selectedIds = Array.from(selectedEmployees.keys()).map((id) => Number(id));
  if (!selectedIds.length) {
    ctMessage.textContent = 'Select at least one employee.';
    return;
  }

  try {
    for (const id of selectedIds) {
      const body = {
        title: ctTitle.value.trim(),
        description: ctDesc.value.trim() || undefined,
        start_date: ctStart.value,
        end_date: ctEnd.value || undefined,
        employee_id: Number(id),
        status: 'not_started'
      };

      await fetchJson('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }

    ctMessage.textContent = 'Task(s) created successfully.';
    form.reset();
    selectedEmployees.clear();
    renderSelected();
  } catch (error) {
    ctMessage.textContent = error.message;
  }
});

loadEmployees();
renderSelected();
