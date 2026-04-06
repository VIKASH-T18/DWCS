const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a workflow name'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    steps: {
        type: [String],
        required: [true, 'Please define steps for this workflow'],
        validate: [v => v.length > 0, 'Workflow must have at least one step']
    },
    actions: {
        type: [String],
        default: []
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Workflow', workflowSchema);
