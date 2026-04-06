const express = require('express');
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
    .get(authorize('Admin', 'Manager'), getUsers);

router.route('/:id')
    .get(authorize('Admin', 'Manager'), getUser)
    .put(authorize('Admin'), updateUser)
    .delete(authorize('Admin'), deleteUser);

module.exports = router;
