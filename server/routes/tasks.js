const express = require('express');
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} = require('../controllers/tasks');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getTasks)
    .post(createTask);

router
    .route('/:id')
    .put(updateTask)
    .delete(authorize('Admin', 'Manager'), deleteTask);

module.exports = router;
