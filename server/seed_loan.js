const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Workflow = require('./models/Workflow');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected correctly for seeding...');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

const seedWorkflow = async () => {
    await connectDB();

    try {
        const user = await User.findOne();
        if (!user) {
            console.error('No user found to assign workflow to. Please register a user first.');
            process.exit(1);
        }

        const workflowName = 'Loan Approval';
        let workflow = await Workflow.findOne({ name: workflowName });

        if (!workflow) {
            workflow = await Workflow.create({
                name: workflowName,
                description: 'Example 3: Conditional Workflow for Loan Approval (Rule-Based)',
                steps: ['Application Received', 'Manager Approval', 'Director Approval', 'Approved'],
                createdBy: user._id
            });
            console.log(`Workflow "${workflowName}" created successfully.`);
        } else {
            console.log(`Workflow "${workflowName}" already exists.`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedWorkflow();
