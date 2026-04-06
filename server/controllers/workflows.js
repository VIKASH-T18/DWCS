const Workflow = require('../models/Workflow');
const Task = require('../models/Task');

// @desc    Get all workflows
// @route   GET /api/workflows
// @access  Private
exports.getWorkflows = async (req, res, next) => {
    try {
        const workflows = await Workflow.find().populate('createdBy', 'username email');
        res.status(200).json({ success: true, count: workflows.length, data: workflows });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Get single workflow
// @route   GET /api/workflows/:id
// @access  Private
exports.getWorkflow = async (req, res, next) => {
    try {
        const workflow = await Workflow.findById(req.params.id).populate('createdBy', 'username email');
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }
        res.status(200).json({ success: true, data: workflow });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Create workflow
// @route   POST /api/workflows
// @access  Private (Admin/Manager)
exports.createWorkflow = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;
        const workflow = await Workflow.create(req.body);
        res.status(201).json({ success: true, data: workflow });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Update workflow
// @route   PUT /api/workflows/:id
// @access  Private (Admin/Manager)
exports.updateWorkflow = async (req, res, next) => {
    try {
        let workflow = await Workflow.findById(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }
        workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Clear (Delete) all associated tasks
        await Task.deleteMany({ workflow: workflow._id });

        res.status(200).json({ success: true, data: workflow });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Delete workflow
// @route   DELETE /api/workflows/:id
// @access  Private (Admin)
exports.deleteWorkflow = async (req, res, next) => {
    try {
        const workflow = await Workflow.findById(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }
        // Delete associated tasks
        await Task.deleteMany({ workflow: workflow._id });

        await workflow.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
