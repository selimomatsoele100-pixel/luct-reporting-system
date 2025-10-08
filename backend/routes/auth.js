const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);

module.exports = router;