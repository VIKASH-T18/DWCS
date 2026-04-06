import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('dwcs-theme') === 'dark';
    });

    const [appName, setAppName] = useState(() => {
        return localStorage.getItem('dwcs-app-name') || 'DWCS';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('dwcs-theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('dwcs-theme', 'light');
        }
    }, [isDark]);

    const toggleDark = () => setIsDark(prev => !prev);

    const updateAppName = (name) => {
        const trimmed = name.trim() || 'DWCS';
        setAppName(trimmed);
        localStorage.setItem('dwcs-app-name', trimmed);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleDark, appName, updateAppName }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
