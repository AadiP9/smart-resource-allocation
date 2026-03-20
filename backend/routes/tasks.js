const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');

// Helper function: Calculate distance in km (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const r = 6371; // Earth's radius in km
  const p = Math.PI / 180;
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + 
            Math.cos(lat1 * p) * Math.cos(lat2 * p) * 
            (1 - Math.cos((lon2 - lon1) * p)) / 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().populate('assigned_volunteer', 'name').sort({ priority: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Task Status (Accept / Complete)
router.post('/:id/status', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { status, volunteer_id } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = status;
    if (volunteer_id) {
      task.assigned_volunteer = volunteer_id;
    }

    await task.save();
    
    // Populate volunteer for the real-time event
    const updatedTask = await Task.findById(task._id).populate('assigned_volunteer', 'name');
    
    // Emit real-time WebSocket update
    io.emit('task_updated', updatedTask);
    
    res.json({ message: 'Task updated', task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Smart Matching Engine API
// Find best volunteers for a task based on distance and urgency
router.get('/:id/match', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // In MVP, just fetch all volunteers and rank them based on distance
    const volunteers = await User.find({ role: 'volunteer' });

    let ranked = volunteers.map(v => {
      let distance = Infinity;
      if (v.location && v.location.lat && v.location.lng) {
        distance = getDistance(task.location.lat, task.location.lng, v.location.lat, v.location.lng);
      }
      
      // Basic matching logic: shorter distance is better
      return {
        volunteer: v,
        distance_km: distance.toFixed(2),
        score: distance === Infinity ? 0 : 100 - (distance * 2) // mock score logic
      };
    });

    // Sort by best score descending
    ranked.sort((a, b) => b.score - a.score);

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
