import { Router } from 'express';

const router = Router();

import { login, register, refresh, logout, getUser, verifyOTP, changePassword, resendOTP, forgotPassword } from '../controllers/authController.js';

router.post('/login', login);
router.post('/register', register);
router.get('/refresh', refresh); 
router.post('/logout', logout);
router.get('/get-user', getUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', changePassword);


export default router;