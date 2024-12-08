tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#eff6ff",
                    100: "#dbeafe",
                    500: "#3b82f6",
                    700: "#1d4ed8",
                    900: "#1e3a8a"
                }
            }
        },
        fontFamily: {
            'body': [
                'Segoe UI',
                'Thing',
                'system-ui',
                'sans-serif'
            ],
            'sans': [
                'Segoe UI',
                'Thing',
                'system-ui',
                'sans-serif'
            ]
        },
        fontSize: {
            'base': '1rem',
            'lg': '1.125rem',
            'xl': '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem'
        },
        lineHeight: {
            'tight': '1.25',
            'snug': '1.375',
            'normal': '1.5',
            'relaxed': '1.625'
        }
    }
}