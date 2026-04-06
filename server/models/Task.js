const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    amount: {
        type: Number
    },
    workflow: {
        type: mongoose.Schema.ObjectId,
        ref: 'Workflow',
        required: true
    },
    currentStep: {
        type: String,
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    dueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    history: [
        {
            step: String,
            changedBy: {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
            comment: String,
            changedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', taskSchema);
