(function() {
    try {
        const savedMode = localStorage.getItem('ai_rewrite_theme_mode') || 'dark';
        let isDark = true;
        if (savedMode === 'light') {
            isDark = false;
        } else if (savedMode === 'dark') {
            isDark = true;
        } else if (savedMode === 'system') {
            isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } catch (e) {}
})();
