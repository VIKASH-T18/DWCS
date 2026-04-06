const express = require('express');
const {
    getWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
} = require('../controllers/workflows');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getWorkflows)
    .post(authorize('Admin', 'Manager'), createWorkflow);

router
    .route('/:id')
    .get(getWorkflow)
    .put(authorize('Admin', 'Manager'), updateWorkflow)
    .delete(authorize('Admin', 'Manager'), deleteWorkflow);

module.exports = router;
