function applyTheme(theme) {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
    const icon = theme === 'light' ? 'ri-sun-line' : 'ri-moon-line';
    const themeToggle = document.getElementById('theme-toggle');
    
    themeToggle.innerHTML = `
        <i class="theme-icon ${icon}" style="
            display: inline-block;
            transition: transform 0.5s ease, color 0.5s ease;
        "></i><span class="theme-text">Theme</span>
    `;
    
    const themeIcon = themeToggle.querySelector('.theme-icon');
    themeIcon.classList.add('theme-icon-spin');
    
    setTimeout(() => {
        themeIcon.classList.remove('theme-icon-spin');
    }, 500);
}

const storedTheme = localStorage.getItem('theme');
applyTheme(storedTheme || 'dark');

const button = document.getElementById('theme-toggle');
button.addEventListener('click', (event) => {
    event.preventDefault();
    const isLight = document.documentElement.classList.toggle('light-theme');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
});

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes iconSpinAnimation {
        0% { transform: rotate(0deg) scale(1); }
        100% { transform: rotate(360deg) scale(1); }
    }

    .theme-icon-spin {
        animation: iconSpinAnimation 0.5s ease-in-out;
    }

    #theme-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .theme-icon {
        transition: transform 0.5s ease, color 0.5s ease;
    }

    .theme-icon:hover {
        transform: scale(1.1);
    }
`;
document.head.appendChild(styleSheet);