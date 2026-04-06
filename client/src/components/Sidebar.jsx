import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, ClipboardList, Settings, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const Sidebar = () => {
    const { user } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Workflows', icon: GitBranch, path: '/workflows', roles: ['Admin', 'Manager'] },
        { name: 'Tasks', icon: ClipboardList, path: '/tasks' },
        { name: 'Users', icon: Users, path: '/users', roles: ['Admin', 'Manager'] },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    const filteredItems = menuItems.filter(item => {
        if (!item.roles) return true;
        const userRole = user?.role
            ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase())
            : 'Employee';
        return item.roles.includes(userRole);
    });

    return (
        <aside className="fixed left-0 top-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sm:translate-x-0 transition-colors duration-200">
            <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
                <ul className="space-y-2 font-medium">
                    {filteredItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => cn(
                                    "flex items-center p-2 text-gray-900 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group transition-colors",
                                    isActive && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 text-gray-500 dark:text-gray-400 transition duration-75 group-hover:text-gray-900 dark:group-hover:text-white",
                                    "group-[.active]:text-blue-600"
                                )} />
                                <span className="ml-3">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;
