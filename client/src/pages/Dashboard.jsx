import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import {
    LayoutDashboard,
    ClipboardList,
    GitBranch,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    Activity,
    Users,
    BarChart3,
    CalendarX
} from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [stats, setStats] = useState({
        totalTasks: 0,
        activeWorkflows: 0,
        completedTasks: 0,
        pendingApprovals: 0,
        overdueTasks: 0
    });
    const [tasks, setTasks] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [activityChartData, setActivityChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [tasksRes, workflowsRes] = await Promise.all([
                    api.get('/tasks'),
                    api.get('/workflows')
                ]);

                const tasksData = tasksRes.data.data || [];
                const workflows = workflowsRes.data.data || [];

                setTasks(tasksData);

                const now = new Date();
                const overdueList = tasksData.filter(t =>
                    t.dueDate &&
                    new Date(t.dueDate) < now &&
                    !['Completed', 'Approved'].includes(t.status)
                );
                setOverdueTasks(overdueList);

                setStats({
                    totalTasks: tasksData.length,
                    activeWorkflows: workflows.length,
                    completedTasks: tasksData.filter(t => ['Completed', 'Approved'].includes(t.status)).length,
                    pendingApprovals: tasksData.filter(t => t.status === 'Pending').length,
                    overdueTasks: overdueList.length
                });

                // Get recent activity from task history
                const activity = [];
                tasksData.forEach(task => {
                    if (task.history && task.history.length > 0) {
                        task.history.forEach(h => {
                            activity.push({
                                taskTitle: task.title,
                                comment: h.comment,
                                changedAt: h.changedAt
                            });
                        });
                    }
                });
                // Sort by date and take last 5
                activity.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
                setRecentActivity(activity.slice(0, 5));

                // Build 7-day activity chart data
                const days = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    days.push({
                        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                        dateStr: d.toISOString().split('T')[0],
                        Events: 0
                    });
                }
                activity.forEach(a => {
                    const dStr = new Date(a.changedAt).toISOString().split('T')[0];
                    const day = days.find(d => d.dateStr === dStr);
                    if (day) day.Events++;
                });
                setActivityChartData(days);

            } catch (err) {
                console.error('Failed to fetch stats', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { name: 'Total Tasks', value: stats.totalTasks, icon: ClipboardList, color: 'blue' },
        { name: 'Active Workflows', value: stats.activeWorkflows, icon: GitBranch, color: 'purple' },
        { name: 'Completed', value: stats.completedTasks, icon: CheckCircle2, color: 'green' },
        { name: 'Pending', value: stats.pendingApprovals, icon: Clock, color: 'orange' },
        { name: 'Overdue', value: stats.overdueTasks, icon: CalendarX, color: 'red' },
    ];

    // Prepare data for charts
    const statusData = [
        { name: 'Pending', value: tasks.filter(t => t.status === 'Pending').length, color: '#f97316' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: '#3b82f6' },
        { name: 'Completed', value: tasks.filter(t => ['Completed', 'Approved'].includes(t.status)).length, color: '#22c55e' },
        { name: 'Rejected', value: tasks.filter(t => t.status === 'Rejected').length, color: '#ef4444' },
    ].filter(item => item.value > 0);

    const priorityData = [
        { name: 'High', value: tasks.filter(t => t.priority === 'High').length },
        { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length },
        { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length },
    ].filter(item => item.value > 0);

    const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#ef4444'];
    const PRIORITY_COLORS = ['#ef4444', '#f97316', '#3b82f6'];

    if (isLoading) return <div className="text-center py-10 dark:text-gray-400">Loading Statistics...</div>;

    const chartConfig = {
        stroke: isDark ? '#4b5563' : '#f1f5f9',
        text: isDark ? '#9ca3af' : '#94a3b8',
        tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#fff',
            border: isDark ? '1px solid #374151' : 'none',
            color: isDark ? '#fff' : '#000'
        }
    };

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.username}</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Here's what's happening in your workflows today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => (
                    <div key={card.name} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4 transition-transform hover:scale-[1.02]">
                        <div className={`p-4 rounded-xl bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600 dark:text-${card.color}-400`}>
                            <card.icon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{card.name}</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Distribution Chart */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Status Distribution</h2>
                    </div>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={chartConfig.tooltip} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 italic">
                            <Activity className="w-12 h-12 mb-4 text-gray-200 dark:text-gray-700" />
                            <p>No task data available.</p>
                        </div>
                    )}
                </div>

                {/* Priority Breakdown Chart */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Priority Breakdown</h2>
                    </div>
                    {priorityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priorityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.stroke} />
                                <XAxis dataKey="name" tick={{ fill: chartConfig.text }} axisLine={{ stroke: chartConfig.stroke }} tickLine={{ stroke: chartConfig.stroke }} />
                                <YAxis tick={{ fill: chartConfig.text }} axisLine={{ stroke: chartConfig.stroke }} tickLine={{ stroke: chartConfig.stroke }} />
                                <Tooltip contentStyle={chartConfig.tooltip} />
                                <Legend wrapperStyle={{ color: chartConfig.text }} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 italic">
                            <Activity className="w-12 h-12 mb-4 text-gray-200 dark:text-gray-700" />
                            <p>No priority data available.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Recent Activity
                        </h2>
                    </div>

                    {/* 7-day Activity Chart */}
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Activity — Last 7 Days</p>
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={activityChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.stroke} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: chartConfig.text }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 10, fill: chartConfig.text }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ ...chartConfig.tooltip, borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Events"
                                    stroke="#3b82f6"
                                    strokeWidth={2.5}
                                    fill="url(#activityGrad)"
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Recent Activity List */}
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{activity.taskTitle}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{activity.comment}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(activity.changedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 italic">
                            <Activity className="w-12 h-12 mb-4 text-gray-200 dark:text-gray-700" />
                            <p>No recent activity to display.</p>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                            Pending Actions
                        </h2>
                    </div>
                    {tasks.filter(t => t.status === 'Pending').length > 0 ? (
                        <div className="space-y-4">
                            {tasks.filter(t => t.status === 'Pending').slice(0, 5).map((task, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                                    <Clock className="w-5 h-5 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{task.title}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Current Step: {task.currentStep}</p>
                                        <span className="inline-block mt-1 text-xs font-bold px-2 py-1 rounded-full bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200">
                                            {task.priority} Priority
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 italic">
                            <CheckCircle2 className="w-12 h-12 mb-4 text-gray-200 dark:text-gray-700" />
                            <p>Everything is up to date.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Overdue Tasks Panel */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border-2 border-red-200 dark:border-red-900/50">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarX className="w-6 h-6 text-red-500 dark:text-red-400" />
                        Overdue Tasks
                    </h2>
                    {overdueTasks.length > 0 && (
                        <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                            {overdueTasks.length} overdue
                        </span>
                    )}
                </div>
                {overdueTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overdueTasks.map((task, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                <CalendarX className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{task.title}</p>
                                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">
                                        Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{task.status}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" />
                                        <span className={`text-xs font-bold ${task.priority === 'High' ? 'text-red-600 dark:text-red-400' :
                                            task.priority === 'Medium' ? 'text-orange-500 dark:text-orange-400' :
                                                'text-blue-500 dark:text-blue-400'
                                            }`}>{task.priority} Priority</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                        <CheckCircle2 className="w-12 h-12 mb-4 text-green-400 dark:text-green-500" />
                        <p className="font-semibold text-green-600 dark:text-green-400">All tasks are on time!</p>
                        <p className="text-sm mt-1 italic">No overdue tasks right now.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
