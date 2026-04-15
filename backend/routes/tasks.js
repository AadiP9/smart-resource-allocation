'use strict';
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { getTopVolunteers } = require('../services/matchingService');

// ---------------------------------------------------------------------------
// GET /api/tasks — all tasks, sorted by priority desc
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assigned_volunteer', 'name')
      .sort({ priority: -1 })
      .lean();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/tasks/:id/match — top 3 volunteers via deterministic matching engine
// ---------------------------------------------------------------------------
router.get('/:id/match', async (req, res) => {
  try {
    const ranked = await getTopVolunteers(req.params.id, 3);
    res.json(ranked);
  } catch (error) {
    console.error('[GET /tasks/:id/match]', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/tasks/:id/status — update task status, manage volunteer availability,
//                               and emit the correct Phase 3 socket event
// ---------------------------------------------------------------------------
router.post('/:id/status', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { status, volunteer_id } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const previousStatus = task.status;
    task.status = status;

    if (volunteer_id) {
      task.assigned_volunteer = volunteer_id;
    }

    await task.save();

    // Manage volunteer availability
    if (status === 'accepted' && volunteer_id) {
      await User.findByIdAndUpdate(volunteer_id, { available: false });
    } else if (status === 'completed' && task.assigned_volunteer) {
      await User.findByIdAndUpdate(task.assigned_volunteer, { available: true });
    }

    const updatedTask = await Task.findById(task._id)
      .populate('assigned_volunteer', 'name')
      .lean();

    // Phase 3: emit named events instead of generic task_updated
    if (status === 'accepted') {
      io.emit('mission_accepted', updatedTask);
    } else if (status === 'in_progress') {
      io.emit('mission_started', updatedTask);
    } else if (status === 'completed') {
      io.emit('mission_completed', updatedTask);
    }

    res.json({ message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error('[POST /tasks/:id/status]', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
