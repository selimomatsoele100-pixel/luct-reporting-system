const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, faculty, class_id, program } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Process class_id - convert empty string to null
    const processedClassId = (class_id === '' || class_id === null || class_id === undefined) ? null : class_id;

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      faculty,
      class_id: processedClassId,
      program
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
        class_id: user.class_id,
        program: user.program
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Provide more specific error messages
    if (error.code === '22P02') {
      return res.status(400).json({ error: 'Invalid data format. Please check your input.' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
        class_id: user.class_id,
        program: user.program
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export all functions
module.exports = {
  register,
  login,
  getProfile
};