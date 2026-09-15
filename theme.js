// Light / dark switch shared by every page. Loaded in <head> so the saved
// theme is applied before first paint (no flash of the wrong palette).
(function () {
  const KEY  = 'ws-theme';
  const root = document.documentElement;

  function saved() {
    try { return localStorage.getItem(KEY); } catch { return null; }
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch {}
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', btn.title);
    }
  }

  root.setAttribute('data-theme', saved() === 'dark' ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.type = 'button';
    btn.addEventListener('click', () => {
      apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    document.body.appendChild(btn);
    apply(root.getAttribute('data-theme'));
  });
})();
