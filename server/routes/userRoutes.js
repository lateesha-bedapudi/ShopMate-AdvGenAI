const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    refreshUserToken,
    sendPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword
} = require('../controllers/userController');
// Remove these if verify.js doesn't exist
 const verifyEmail = require('../services/verify');

router.post('/register', registerUser);
router.post('/send-password-reset-otp', sendPasswordResetOTP);
router.post('/verify-password-reset-otp', verifyPasswordResetOTP);
router.post('/reset-password', resetPassword);

router.get('/verify-email/:token', verifyEmail);

router.post('/login', loginUser);
router.post('/refresh-token', refreshUserToken);

module.exports = router;