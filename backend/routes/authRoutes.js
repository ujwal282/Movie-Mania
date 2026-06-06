const express = require('express');
const { registerUser, loginUser, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/changepassword', protect, changePassword);

module.exports = router;
