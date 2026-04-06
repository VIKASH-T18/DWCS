import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Monitor, Palette, Type, Shield, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
    const { isDark, toggleDark, appName, updateAppName } = useTheme();
    const { user } = useAuth();
    const [nameInput, setNameInput] = useState(appName);
    const [saved, setSaved] = useState(false);

    const handleSaveName = () => {
        updateAppName(nameInput);
        setSaved(true);
        toast.success('Settings saved!');
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your application preferences</p>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                        <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Appearance</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Customize how DWCS looks on your device</p>
                    </div>
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-indigo-900/40' : 'bg-yellow-50'}`}>
                            {isDark
                                ? <Moon className="w-5 h-5 text-indigo-400" />
                                : <Sun className="w-5 h-5 text-yellow-500" />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {isDark ? 'Dark Mode' : 'Light Mode'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                            </p>
                        </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                        onClick={toggleDark}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            ${isDark ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        role="switch"
                        aria-checked={isDark}
                    >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200
                                ${isDark ? 'translate-x-8' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

                {/* Theme preview */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => isDark && toggleDark()}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${!isDark
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                    >
                        <div className="w-full h-10 bg-white rounded-lg border border-gray-200 flex items-center px-3 gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-200" />
                            <div className="flex-1 h-2 rounded bg-gray-100" />
                        </div>
                        <span className={`text-xs font-bold flex items-center gap-1 ${!isDark ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Sun className="w-3 h-3" /> Light
                            {!isDark && <Check className="w-3 h-3" />}
                        </span>
                    </button>
                    <button
                        onClick={() => !isDark && toggleDark()}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                            ${isDark
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="w-full h-10 bg-gray-800 rounded-lg border border-gray-700 flex items-center px-3 gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-600" />
                            <div className="flex-1 h-2 rounded bg-gray-700" />
                        </div>
                        <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-indigo-500' : 'text-gray-500'}`}>
                            <Moon className="w-3 h-3" /> Dark
                            {isDark && <Check className="w-3 h-3" />}
                        </span>
                    </button>
                </div>
            </div>

            {/* App Name */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30">
                        <Type className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Application Name</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Shown in the navigation bar</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        maxLength={20}
                        placeholder="DWCS"
                        className="flex-1 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                    <button
                        onClick={handleSaveName}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all
                            ${saved
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                            }`}
                    >
                        {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/30">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Account</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Your current session info</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Username', value: user?.username },
                        { label: 'Email', value: user?.email },
                        { label: 'Role', value: user?.role },
                        { label: 'Theme', value: isDark ? 'Dark Mode' : 'Light Mode' },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{value || '—'}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Settings;
