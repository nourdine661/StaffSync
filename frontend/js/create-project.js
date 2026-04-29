import { authHeaders, getUser, requireLogin } from './auth.js';

const isLoggedIn = requireLogin();
const user = getUser();

const form = document.getElementById('createProjectForm');
const cpDepartment = document.getElementById('cpDepartment');
const cpDescription = document.getElementById('cpDescription');
const cpBudget = document.getElementById('cpBudget');
const cpStart = document.getElementById('cpStart');
const cpEnd = document.getElementById('cpEnd');
const cpOwner = document.getElementById('cpOwner');
const cpMessage = document.getElementById('cpMessage');

if (!isLoggedIn || (user?.role || 'employee') !== 'admin') {
  cpMessage.textContent = 'Admin login required to create projects.';
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

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isLoggedIn || (user?.role || 'employee') !== 'admin') return;

  try {
    const body = {
      department_name: cpDepartment.value.trim(),
      description: cpDescription.value.trim() || undefined,
      budget: cpBudget.value ? Number(cpBudget.value) : undefined,
      start_date: cpStart.value,
      end_date: cpEnd.value || undefined,
      status: true,
      employee_id: cpOwner.value ? Number(cpOwner.value) : undefined
    };

    await fetchJson('/api/projects', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    cpMessage.textContent = 'Project created successfully.';
    form.reset();
  } catch (error) {
    cpMessage.textContent = error.message;
  }
});
