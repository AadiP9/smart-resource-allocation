const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret';

// Mock Register
router.post('/register', async (req, res) => {
  try {
    const { name, role, skills, location } = req.body;
    const user = new User({ name, role, skills, location });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock Login
router.post('/login', async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users by role (e.g. for matching volunteers)
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
