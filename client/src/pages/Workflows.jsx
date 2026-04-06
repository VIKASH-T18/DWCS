import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { GitBranch, Plus, Trash2, Edit, Search, X, Check, AlertCircle, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { useTheme } from '../context/ThemeContext';

// Use inline styles — Tailwind JIT purges dynamically composed class names
const PRIORITY_STYLE = {
    High: { background: '#fef2f2', darkBg: '#f50505ff', color: '#ea0e0eff', darkColor: '#f0cfcfff', border: '1.5px solid #fecaca', darkBorder: '1.5px solid #ce3131ff', dot: '#dc2626' },
    Medium: { background: '#fff7ed', darkBg: '#431407', color: '#ea580c', darkColor: '#fb923c', border: '1.5px solid #fed7aa', darkBorder: '1.5px solid #f26637ff', dot: '#ea580c' },
    Low: { background: '#eff6ff', darkBg: '#172554', color: '#2563eb', darkColor: '#60a5fa', border: '1.5px solid #bfdbfe', darkBorder: '1.5px solid #1e3a8a', dot: '#2563eb' },
};

const Workflows = () => {
    const { isDark } = useTheme();
    const [workflows, setWorkflows] = useState([]);
    // ... rest of state ...
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const PREDEFINED_ACTIONS = ['Manager Approval', 'HR Approval', 'Employee Approval'];

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        steps: [],
        actions: [],
        priority: 'Medium'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const res = await api.get('/workflows');
            setWorkflows(res.data.data);
        } catch (err) {
            console.error('Error fetching workflows', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (workflow) => {
        setEditingId(workflow._id);
        setFormData({
            name: workflow.name,
            description: workflow.description,
            steps: Array.isArray(workflow.steps) ? workflow.steps : [],
            actions: Array.isArray(workflow.actions) ? workflow.actions : [],
            priority: workflow.priority || 'Medium'
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.steps.length === 0) {
                return toast.error('Please select at least one step');
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                steps: formData.steps,
                actions: formData.actions,
                priority: formData.priority
            };

            if (editingId) {
                await api.put(`/workflows/${editingId}`, payload);
                toast.success('Workflow updated successfully!');
            } else {
                await api.post('/workflows', payload);
                toast.success('Workflow created successfully!');
            }

            setShowModal(false);
            setFormData({ name: '', description: '', steps: [], actions: [], priority: 'Medium' });
            setEditingId(null);
            fetchWorkflows();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save workflow');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this workflow?')) {
            try {
                await api.delete(`/workflows/${id}`);
                fetchWorkflows();
                toast.success('Workflow deleted');
            } catch (err) {
                toast.error(err.response?.data?.error || 'Failed to delete workflow');
            }
        }
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <Loader className="py-20" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows</h1>
                <div className="flex w-full md:w-auto gap-4">
                    <div className="relative flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search workflows..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', description: '', steps: [], actions: [], priority: 'Medium' });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        New Workflow
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkflows.map((workflow) => {
                    const priority = workflow.priority || 'Medium';
                    const ps = PRIORITY_STYLE[priority] || PRIORITY_STYLE.Medium;
                    return (
                        <div key={workflow._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <GitBranch className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{workflow.name}</h3>
                                    </div>
                                    {/* Priority badge — inline styles prevent Tailwind JIT purge */}
                                    <span
                                        style={{
                                            background: isDark ? ps.darkBg : ps.background,
                                            color: isDark ? ps.darkColor : ps.color,
                                            border: isDark ? ps.darkBorder : ps.border
                                        }}
                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                                    >
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDark ? ps.darkColor : ps.dot, display: 'inline-block' }} />
                                        {priority}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{workflow.description}</p>

                                <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-1">Steps:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(workflow.steps || []).map((step, idx) => (
                                            <span key={idx} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                                                {step}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {workflow.actions && workflow.actions.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-1">Actions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {workflow.actions.map((action, idx) => {
                                                const lower = action.toLowerCase();
                                                const isApproved = lower.includes('approv');
                                                const isRejected = lower.includes('reject') || lower.includes('decline');
                                                return (
                                                    <span
                                                        key={idx}
                                                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded border
                                                            ${isApproved ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' :
                                                                isRejected ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                                                                    'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-600'}`}
                                                    >
                                                        {isApproved && <Check className="w-3 h-3" />}
                                                        {isRejected && <X className="w-3 h-3" />}
                                                        {action}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-50 dark:border-gray-700 mt-4">
                                <button
                                    onClick={() => handleEdit(workflow)}
                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(workflow._id)}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{editingId ? 'Edit Workflow' : 'Create New Workflow'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Workflow Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Priority selector */}
                            <div>
                                <label className="block text-sm font-bold mb-1 flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                    <Flag className="w-4 h-4" /> Priority
                                </label>
                                <div className="flex gap-3">
                                    {['High', 'Medium', 'Low'].map((level) => {
                                        const ps = PRIORITY_STYLE[level];
                                        const selected = formData.priority === level;
                                        return (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, priority: level })}
                                                style={selected ? {
                                                    background: isDark ? ps.darkBg : ps.background,
                                                    color: isDark ? ps.darkColor : ps.color,
                                                    border: isDark ? ps.darkBorder : `2px solid ${ps.dot}`
                                                } : {}}
                                                className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2
                                                    ${!selected ? 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600' : ''}`}
                                            >
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: selected ? (isDark ? ps.darkColor : ps.dot) : '#d1d5db', display: 'inline-block', flexShrink: 0 }} />
                                                {level}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Steps</label>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Select the approval roles for this workflow (in order)</p>
                                <div className="flex flex-col gap-2">
                                    {PREDEFINED_ACTIONS.map((step) => {
                                        const checked = formData.steps.includes(step);
                                        return (
                                            <label
                                                key={step}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none
                                                    ${checked ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 accent-blue-600"
                                                    checked={checked}
                                                    onChange={() => {
                                                        const updated = checked
                                                            ? formData.steps.filter(s => s !== step)
                                                            : [...formData.steps, step];
                                                        setFormData({ ...formData, steps: updated });
                                                    }}
                                                />
                                                <Check className={`w-4 h-4 ${checked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                                <span className="font-semibold text-sm">{step}</span>
                                            </label>
                                        );
                                    })}
                                </div>
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
                                    {editingId ? 'Update Workflow' : 'Create Workflow'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workflows;
