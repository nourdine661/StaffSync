import { saveSession, clearSession } from './auth.js';

const form = document.getElementById('loginForm');
const message = document.getElementById('message');

clearSession();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/employees/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.error || 'Login failed';
      return;
    }

    saveSession(data.token, data.user);

    if ((data.user?.role || 'employee') === 'admin') {
      window.location.href = './admin.html';
    } else {
      window.location.href = './employee.html';
    }
  } catch (error) {
    message.textContent = 'Network error, please try again.';
  }
});
