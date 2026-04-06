import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, Download, ThumbsUp, ThumbsDown, ArrowRight, Check, CheckCircle2, X, Flag, Calendar, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import Papa from 'papaparse';
import { useTheme } from '../context/ThemeContext';

const Tasks = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();

    // Redefined styles with dark mode awareness
    const PRIORITY_STYLE = {
        High: { background: '#fef2f2', darkBg: '#450a0a', color: '#dc2626', darkColor: '#f87171', border: '1.5px solid #fecaca', darkBorder: '1.5px solid #7f1d1d' },
        Medium: { background: '#fff7ed', darkBg: '#431407', color: '#ea580c', darkColor: '#fb923c', border: '1.5px solid #fed7aa', darkBorder: '1.5px solid #7c2d12' },
        Low: { background: '#eff6ff', darkBg: '#172554', color: '#2563eb', darkColor: '#60a5fa', border: '1.5px solid #bfdbfe', darkBorder: '1.5px solid #1e3a8a' },
    };

    const STATUS_STYLE = {
        Pending: { background: '#fff7ed', darkBg: '#431407', color: '#ea580c', darkColor: '#fb923c', border: '1.5px solid #fed7aa', darkBorder: '1.5px solid #7c2d12' },
        'In Progress': { background: '#eff6ff', darkBg: '#172554', color: '#2563eb', darkColor: '#60a5fa', border: '1.5px solid #bfdbfe', darkBorder: '1.5px solid #1e3a8a' },
        Completed: { background: '#f0fdf4', darkBg: '#064e3b', color: '#16a34a', darkColor: '#4ade80', border: '1.5px solid #bbf7d0', darkBorder: '1.5px solid #065f46' },
        Approved: { background: '#f0fdf4', darkBg: '#064e3b', color: '#15803d', darkColor: '#4ade80', border: '1.5px solid #86efac', darkBorder: '1.5px solid #065f46' },
        Rejected: { background: '#fef2f2', darkBg: '#450a0a', color: '#dc2626', darkColor: '#f87171', border: '1.5px solid #fecaca', darkBorder: '1.5px solid #7f1d1d' },
    };

    const [tasks, setTasks] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [lastAction, setLastAction] = useState({}); // { [taskId]: { label, type } }
    const [showDetail, setShowDetail] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        workflow: '',
        priority: '',
        dueDate: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tasksRes, workflowsRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/workflows')
            ]);
            setTasks(tasksRes.data.data);
            setWorkflows(workflowsRes.data.data);
        } catch (err) {
            console.error('Error fetching data', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.dueDate) delete payload.dueDate;

            if (isEditing) {
                await api.put(`/tasks/${editingTaskId}`, payload);
                toast.success('Task updated!');
            } else {
                await api.post('/tasks', payload);
                toast.success('Task created!');
            }

            setShowModal(false);
            setFormData({ title: '', description: '', workflow: '', priority: '', dueDate: '' });
            setIsEditing(false);
            setEditingTaskId(null);
            fetchData();
        } catch (err) {
            toast.error(isEditing ? 'Failed to update task' : 'Failed to create task');
        }
    };

    const handleEdit = (task) => {
        setFormData({
            title: task.title,
            description: task.description || '',
            workflow: task.workflow?._id || '',
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        });
        setEditingTaskId(task._id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await api.delete(`/tasks/${taskId}`);
                toast.success('Task deleted!');
                fetchData();
            } catch (err) {
                toast.error('Failed to delete task');
            }
        }
    };

    const handleStepChange = async (taskId, newStep) => {
        try {
            await api.put(`/tasks/${taskId}`, { currentStep: newStep, comment: `Moved to ${newStep}` });
            fetchData();
            toast.success(`Moved to ${newStep}`);
        } catch (err) {
            toast.error('Failed to update task step');
        }
    };

    // Which steps each role is allowed to act on
    const ROLE_ALLOWED_STEPS = {
        Admin: ['Manager Approval', 'HR Approval', 'Employee Approval'],
        Manager: ['Manager Approval', 'HR Approval', 'Employee Approval'],
        HR: ['HR Approval', 'Employee Approval'],
        Employee: ['Employee Approval'],
    };

    const getAllActions = (task) => {
        // No actions for terminal states
        if (['Completed', 'Approved', 'Rejected'].includes(task.status)) return [];

        const steps = task.workflow?.steps || [];
        if (steps.length === 0) return [];

        const currentStep = task.currentStep;
        const allowedForRole = ROLE_ALLOWED_STEPS[user?.role] || [];

        // The user's role can act on this step — show Approve and Reject
        if (currentStep && allowedForRole.includes(currentStep)) {
            return ['Approve', 'Reject'];
        }

        return [];
    };

    const getActionType = (actionName) => {
        const lower = actionName.toLowerCase();
        if (lower.includes('approv') || lower.includes('accept')) return 'approved';
        if (lower.includes('reject') || lower.includes('declin') || lower.includes('deny')) return 'rejected';
        return 'done';
    };

    // Extract the action name from the last history comment (format: "ActionName → Moved to Step")
    const getLastAction = (task) => {
        if (!task.history || task.history.length === 0) return null;
        const lastComment = task.history[task.history.length - 1].comment || '';
        // Comments are stored as "ActionName → Moved to Step" or "ActionName — Task approved" etc.
        const arrowMatch = lastComment.match(/^(.+?)\s*[→—]/);
        return arrowMatch ? arrowMatch[1].trim() : null;
    };

    const handleActionClick = async (taskId, actionName) => {
        try {
            const task = tasks.find(t => t._id === taskId);
            if (!task) return;

            const steps = task.workflow?.steps || [];
            const currentIndex = steps.indexOf(task.currentStep);
            const actionType = getActionType(actionName);
            const isLastStep = currentIndex === -1 || currentIndex >= steps.length - 1;

            if (!isLastStep) {
                // Not the last step — move to next step regardless of action type
                const nextStep = steps[currentIndex + 1];
                await api.put(`/tasks/${taskId}`, {
                    currentStep: nextStep,
                    comment: `${actionName} → Moved to ${nextStep}`
                });
                toast.success(`${actionName} ✓ — moved to ${nextStep}`);
            } else {
                // Last step: permanently set Approved or Rejected based on action type
                if (actionType === 'rejected') {
                    await api.put(`/tasks/${taskId}`, {
                        status: 'Rejected',
                        comment: `${actionName} — Task rejected`
                    });
                    toast.error(`Task rejected`);
                } else if (actionType === 'approved') {
                    await api.put(`/tasks/${taskId}`, {
                        status: 'Approved',
                        comment: `${actionName} — Task approved`
                    });
                    toast.success(`✓ Task approved!`);
                } else {
                    await api.put(`/tasks/${taskId}`, {
                        status: 'Completed',
                        comment: `${actionName} — Task completed`
                    });
                    toast.success(`${actionName} — Task completed`);
                }
            }

            fetchData();
        } catch (err) {
            toast.error('Failed to perform action');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Helper: is a task overdue?
    const isOverdue = (task) => {
        if (!task.dueDate) return false;
        if (['Completed', 'Approved'].includes(task.status)) return false;
        return new Date(task.dueDate) < new Date();
    };

    const handleExportCSV = () => {
        const exportData = filteredTasks.map(task => ({
            Title: task.title,
            Description: task.description,
            Workflow: task.workflow?.name || 'N/A',
            'Current Step': task.currentStep,
            Status: task.status,
            Priority: task.priority,
            'Due Date': task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
            'Created At': new Date(task.createdAt).toLocaleDateString()
        }));

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Tasks exported successfully!');
    };

    if (isLoading) return <Loader className="py-20" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
                <div className="flex flex-wrap w-full lg:w-auto gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        New Task
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                        <Download className="w-5 h-5" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Workflow</th>
                            <th className="px-6 py-4">Current Step</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {filteredTasks.map((task) => (
                            <tr
                                key={task._id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setSelectedTask(task);
                                    setShowDetail(true);
                                }}
                            >
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{task.title}</td>
                                <td className="px-6 py-4 dark:text-gray-300">{task.workflow?.name}</td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase border border-blue-100 dark:border-blue-800 whitespace-nowrap">
                                        {task.currentStep}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        style={{
                                            background: isDark ? (STATUS_STYLE[task.status] || STATUS_STYLE.Pending).darkBg : (STATUS_STYLE[task.status] || STATUS_STYLE.Pending).background,
                                            color: isDark ? (STATUS_STYLE[task.status] || STATUS_STYLE.Pending).darkColor : (STATUS_STYLE[task.status] || STATUS_STYLE.Pending).color,
                                            border: isDark ? (STATUS_STYLE[task.status] || STATUS_STYLE.Pending).darkBorder : (STATUS_STYLE[task.status] || STATUS_STYLE.Pending).border
                                        }}
                                        className="text-xs font-bold px-3 py-1 rounded-full uppercase inline-flex items-center gap-1"
                                    >
                                        {task.status === 'Approved' && <ThumbsUp className="w-3 h-3" />}
                                        {task.status === 'Rejected' && <ThumbsDown className="w-3 h-3" />}
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        style={{
                                            background: isDark ? (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).darkBg : (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).background,
                                            color: isDark ? (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).darkColor : (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).color,
                                            border: isDark ? (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).darkBorder : (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).border
                                        }}
                                        className="text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5"
                                    >
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDark ? (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).darkColor : (PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium).color, display: 'inline-block' }} />
                                        {task.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {task.dueDate ? (
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${isOverdue(task)
                                                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                                }`}
                                        >
                                            <Calendar className="w-3 h-3" />
                                            {isOverdue(task) && <span>OVERDUE · </span>}
                                            {new Date(task.dueDate).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 dark:text-gray-600 text-xs">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex gap-2 mb-1">
                                            <button
                                                onClick={() => handleEdit(task)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Edit Task"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span className="sr-only">Edit</span>
                                            </button>
                                            {user?.role === 'Admin' && (
                                                <button
                                                    onClick={() => handleDelete(task._id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="sr-only">Delete</span>
                                                </button>
                                            )}
                                        </div>
                                        {/* Last action performed badge */}
                                        {getLastAction(task) && (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 w-fit">
                                                <Check className="w-3 h-3" />
                                                {getLastAction(task)}
                                            </span>
                                        )}
                                        {/* Terminal status or action button */}
                                        {['Approved', 'Rejected', 'Completed'].includes(task.status) ? (
                                            <span
                                                style={{
                                                    background: isDark ? STATUS_STYLE[task.status].darkBg : STATUS_STYLE[task.status].background,
                                                    color: isDark ? STATUS_STYLE[task.status].darkColor : STATUS_STYLE[task.status].color,
                                                    border: isDark ? STATUS_STYLE[task.status].darkBorder : STATUS_STYLE[task.status].border
                                                }}
                                                className="text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 w-fit"
                                            >
                                                {task.status === 'Approved' && <ThumbsUp className="w-3 h-3" />}
                                                {task.status === 'Rejected' && <ThumbsDown className="w-3 h-3" />}
                                                {task.status === 'Completed' && <Check className="w-3 h-3" />}
                                                {task.status}
                                            </span>
                                        ) : getAllActions(task).length > 0 ? (
                                            /* User's role can act on current step — show Approve / Reject */
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleActionClick(task._id, 'Approve')}
                                                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                                                >
                                                    <ThumbsUp className="w-3 h-3" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleActionClick(task._id, 'Reject')}
                                                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                                                >
                                                    <ThumbsDown className="w-3 h-3" /> Reject
                                                </button>
                                            </div>
                                        ) : (task.workflow?.steps?.length > 0 && !['Approved', 'Rejected', 'Completed'].includes(task.status)) ? (
                                            /* User's role cannot act on current step — show waiting indicator */
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 w-fit">
                                                <ArrowRight className="w-3 h-3" />
                                                Awaiting {task.currentStep}
                                            </span>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-white/10">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                            {isEditing ? 'Edit Task' : 'Create New Task'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Workflow</label>
                                <select
                                    required
                                    disabled={isEditing}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={formData.workflow}
                                    onChange={(e) => {
                                        const selectedWorkflow = workflows.find(w => w._id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            workflow: e.target.value,
                                            priority: selectedWorkflow?.priority || 'Medium'
                                        });
                                    }}
                                >
                                    <option value="">Select Workflow</option>
                                    {workflows.map(w => <option key={w._id} value={w._id} className="dark:bg-gray-800">{w.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">
                                    Due Date <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="date"
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none"
                                >
                                    <Check className="w-5 h-5" />
                                    {isEditing ? 'Save Changes' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Detail Slide-over */}
            {showDetail && selectedTask && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity backdrop-blur-sm" onClick={() => setShowDetail(false)} />
                    <div className="fixed inset-y-0 right-0 max-w-full flex">
                        <div className="w-screen max-w-md">
                            <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl overflow-y-scroll border-l border-white/10">
                                <div className="p-6 border-b dark:border-gray-700">
                                    <div className="flex items-start justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTask.title}</h2>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setShowDetail(false);
                                                    handleEdit(selectedTask);
                                                }}
                                                className="h-8 w-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Edit Task"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            {user?.role === 'Admin' && (
                                                <button
                                                    onClick={() => {
                                                        setShowDetail(false);
                                                        handleDelete(selectedTask._id);
                                                    }}
                                                    className="h-8 w-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowDetail(false)}
                                                className="ml-3 h-7 flex items-center text-gray-400 hover:text-gray-500 transition-colors"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Workflow: {selectedTask.workflow?.name}
                                    </p>
                                </div>

                                <div className="flex-1 p-6 space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Current Status</h3>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1 rounded-full uppercase border border-blue-100 dark:border-blue-800">
                                                {selectedTask.currentStep}
                                            </span>
                                            <span
                                                style={{
                                                    background: isDark ? (STATUS_STYLE[selectedTask.status] || STATUS_STYLE.Pending).darkBg : (STATUS_STYLE[selectedTask.status] || STATUS_STYLE.Pending).background,
                                                    color: isDark ? (STATUS_STYLE[selectedTask.status] || STATUS_STYLE.Pending).darkColor : (STATUS_STYLE[selectedTask.status] || STATUS_STYLE.Pending).color,
                                                    border: isDark ? (STATUS_STYLE[selectedTask.status] || STATUS_STYLE.Pending).darkBorder : (STATUS_STYLE[selectedTask.status] || STATUS_STYLE.Pending).border
                                                }}
                                                className="text-xs font-bold px-3 py-1 rounded-full uppercase inline-flex items-center gap-1"
                                            >
                                                {selectedTask.status === 'Approved' && <ThumbsUp className="w-3 h-3" />}
                                                {selectedTask.status === 'Rejected' && <ThumbsDown className="w-3 h-3" />}
                                                {selectedTask.status}
                                            </span>
                                            <span
                                                style={{
                                                    background: isDark ? (PRIORITY_STYLE[selectedTask.priority] || PRIORITY_STYLE.Medium).darkBg : (PRIORITY_STYLE[selectedTask.priority] || PRIORITY_STYLE.Medium).background,
                                                    color: isDark ? (PRIORITY_STYLE[selectedTask.priority] || PRIORITY_STYLE.Medium).darkColor : (PRIORITY_STYLE[selectedTask.priority] || PRIORITY_STYLE.Medium).color,
                                                    border: isDark ? (PRIORITY_STYLE[selectedTask.priority] || PRIORITY_STYLE.Medium).darkBorder : (PRIORITY_STYLE[selectedTask.priority] || PRIORITY_STYLE.Medium).border
                                                }}
                                                className="text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5"
                                            >
                                                <Flag className="w-3 h-3" />
                                                {selectedTask.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Due Date */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Due Date</h3>
                                        {selectedTask.dueDate ? (
                                            <span
                                                className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl ${isOverdue(selectedTask)
                                                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-600'
                                                    }`}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                {isOverdue(selectedTask) && <span className="text-red-600 dark:text-red-400">⚠ OVERDUE · </span>}
                                                {new Date(selectedTask.dueDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        ) : (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No due date set.</p>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Description</h3>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap border border-gray-100 dark:border-gray-700">
                                            {selectedTask.description || 'No description provided.'}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Available Actions</h3>
                                        <div className="flex flex-col gap-3">
                                            {getAllActions(selectedTask).length > 0 ? (
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleActionClick(selectedTask._id, e.target.value);
                                                            setShowDetail(false);
                                                        }
                                                    }}
                                                    className="w-full p-4 bg-white dark:bg-gray-700 border-2 border-blue-50 dark:border-gray-600 focus:border-blue-500 rounded-xl font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled className="dark:bg-gray-800">Choose an action...</option>
                                                    {getAllActions(selectedTask).map((action, idx) => (
                                                        <option key={idx} value={action} className="dark:bg-gray-800">
                                                            {action}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                !['Completed', 'Approved', 'Rejected'].includes(selectedTask.status) && (
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center text-gray-500 dark:text-gray-400 text-sm font-medium border border-dashed border-gray-200 dark:border-gray-600">
                                                        No actions available at this step.
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {selectedTask.history && selectedTask.history.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">History</h3>
                                            <div className="space-y-4 border-l-2 border-gray-100 dark:border-gray-700 pl-4 ml-2">
                                                {selectedTask.history.slice().reverse().map((item, idx) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[25px] mt-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-800" />
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.comment}</p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(item.changedAt).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
