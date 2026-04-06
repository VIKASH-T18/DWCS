const Task = require('../models/Task');
const Workflow = require('../models/Workflow');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
    try {
        let query;

        // If employee, only show tasks assigned to them or created by them
        if (req.user.role === 'Employee') {
            query = Task.find({
                $or: [
                    { assignedTo: req.user.id },
                    { createdBy: req.user.id },
                    { assignedTo: null },
                    { assignedTo: { $exists: false } }
                ]
            });
        } else {
            query = Task.find();
        }

        const tasks = await query.populate('assignedTo', 'username email').populate('workflow', 'name steps actions');
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;

        // Validate workflow exists
        const workflow = await Workflow.findById(req.body.workflow);
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        // Set initial step
        req.body.currentStep = workflow.steps[0];

        // Inherit priority from workflow if not explicitly set
        if (!req.body.priority) {
            req.body.priority = workflow.priority;
        }

        const task = await Task.create(req.body);
        res.status(201).json({ success: true, data: task });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Track changes for history
        const updates = [];
        if (req.body.title && req.body.title !== task.title) updates.push('title');
        if (req.body.description && req.body.description !== task.description) updates.push('description');
        if (req.body.priority && req.body.priority !== task.priority) updates.push('priority');
        if (req.body.dueDate && req.body.dueDate !== task.dueDate) updates.push('due date');
        if (req.body.currentStep && req.body.currentStep !== task.currentStep) updates.push('step');
        if (req.body.status && req.body.status !== task.status) updates.push('status');

        if (updates.length > 0) {
            const comment = req.body.comment || `Updated ${updates.join(', ')}`;
            task.history.push({
                step: req.body.currentStep || task.currentStep,
                changedBy: req.user.id,
                comment: comment
            });
        }

        // Apply updates
        Object.keys(req.body).forEach(key => {
            if (key !== 'history') {
                task[key] = req.body[key];
            }
        });

        await task.save();

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};


// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin/Manager)
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Check ownership/role
        if (task.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this task' });
        }

        await task.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
