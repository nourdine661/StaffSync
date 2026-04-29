const STORAGE_KEY = 'theme_preference';

function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('theme-dark');
  } else {
    root.classList.remove('theme-dark');
  }
}

function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
  const next = document.documentElement.classList.contains('theme-dark') ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
  updateButton(next);
}

let toggleBtn;
function updateButton(mode) {
  if (!toggleBtn) return;
  toggleBtn.textContent = mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function insertToggle() {
  toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'theme-toggle';
  toggleBtn.addEventListener('click', toggleTheme);
  document.body.appendChild(toggleBtn);
  updateButton(document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light');
}

const initial = getPreferredTheme();
applyTheme(initial);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', insertToggle, { once: true });
} else {
  insertToggle();
}
