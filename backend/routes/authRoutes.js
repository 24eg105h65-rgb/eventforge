const express = require('express');
const { register, login, logout, getMe, updateMe, roleCheck } = require('../controllers/authController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, meSchema, updateMeSchema } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', auth, logout);
router.get('/me', auth, validate(meSchema), getMe);
router.put('/me', auth, validate(updateMeSchema), updateMe);
router.get('/role-check', auth, authorize('organizer'), roleCheck);

module.exports = router;
