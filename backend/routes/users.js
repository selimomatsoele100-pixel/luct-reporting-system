const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Get all users (PL only)
router.get('/', authenticate, authorize('pl', 'fmg'), async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users by role
router.get('/role/:role', authenticate, async (req, res) => {
  try {
    const users = await User.getUsersByRole(req.params.role);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', authenticate, authorize('pl'), async (req, res) => {
  try {
    const user = await User.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;