import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
            <Navbar />
            <Sidebar />
            <main className="p-4 sm:ml-64 h-auto pt-20">
                <div className="mx-auto max-w-screen-2xl">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
