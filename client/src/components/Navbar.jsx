import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, Activity, Moon, Sun } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleDark, appName } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 fixed left-0 right-0 top-0 z-50 transition-colors duration-200">
            <div className="flex flex-wrap justify-between items-center">
                <div className="flex justify-start items-center">
                    <Link to="/" className="flex items-center justify-between mr-4">
                        <Activity className="mr-3 h-8 w-8 text-blue-600" />
                        <span className="self-center text-2xl font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                            {appName}
                        </span>
                    </Link>
                </div>
                <div className="flex items-center gap-2 lg:order-2">
                    {/* Dark mode toggle button */}
                    <button
                        onClick={toggleDark}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        {isDark
                            ? <Sun className="w-5 h-5 text-yellow-400" />
                            : <Moon className="w-5 h-5" />
                        }
                    </button>

                    {user && (
                        <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white rounded-full hover:text-blue-600 md:mr-0">
                            <span className="mr-2 hidden sm:inline dark:text-gray-300">{user.username} ({user.role})</span>
                            <User className="w-8 h-8 mr-2 bg-gray-100 dark:bg-gray-700 rounded-full p-1 dark:text-gray-300" />
                            <button
                                onClick={handleLogout}
                                className="flex items-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium rounded-lg text-sm px-4 py-2"
                            >
                                <LogOut className="w-5 h-5 mr-1" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
