const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/profile', updateProfile);

module.exports = router;
