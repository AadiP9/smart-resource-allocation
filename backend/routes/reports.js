const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Task = require('../models/Task');

// Simulated AI Processing functions
function simulateAI(raw_input) {
  const inputLower = raw_input.toLowerCase();
  
  // Simulated NLP extraction
  let processed_type = 'general';
  if (inputLower.includes('medical') || inputLower.includes('blood') || inputLower.includes('injured')) {
    processed_type = 'medical';
  } else if (inputLower.includes('food') || inputLower.includes('hunger') || inputLower.includes('starving')) {
    processed_type = 'food';
  } else if (inputLower.includes('shelter') || inputLower.includes('tent') || inputLower.includes('homeless')) {
    processed_type = 'shelter';
  } else if (inputLower.includes('rescue')) {
    processed_type = 'rescue';
  }

  // Simulated Priority Engine
  let urgency_score = 10; // base score
  
  if (processed_type === 'medical' || processed_type === 'rescue') {
    urgency_score += 60; // 70 total
  } else if (processed_type === 'food') {
    urgency_score += 40; // 50 total
  } else if (processed_type === 'shelter') {
    urgency_score += 30; // 40 total
  }

  // Add random variance (+/- 10) to make it look dynamic
  urgency_score += Math.floor(Math.random() * 20) - 10;
  
  // Cap between 0 and 100
  urgency_score = Math.max(0, Math.min(100, urgency_score));

  return { processed_type, urgency_score };
}

router.post('/', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { raw_input, location } = req.body;
    
    // Simulate AI extraction and scoring
    const { processed_type, urgency_score } = simulateAI(raw_input);

    const report = new Report({ raw_input, processed_type, urgency_score, location });
    await report.save();

    // Automatically create a Task derived from this report
    const taskTitle = `Need ${processed_type} at location`;
    const task = new Task({
      title: taskTitle,
      type: processed_type,
      priority: urgency_score,
      location: location,
      status: 'pending'
    });
    await task.save();

    // Fire real-time events to dashboard and volunteers
    io.emit('new_report', report);
    io.emit('new_task', task);

    res.status(201).json({ message: 'Report processed successfully', report, task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/simulate', async (req, res) => {
  const io = req.app.get('io');
  try {
    const dummyReports = [
      { raw_input: "Massive earthquake damage, thousands trapped. Need medical and rescue teams instantly!!", loc: { lat: 21.0, lng: 78.5 } },
      { raw_input: "Heavy floods washed away houses. At least 50 families needing food and shelter.", loc: { lat: 19.5, lng: 77.2 } },
      { raw_input: "Fire spreading rapidly in sector 4. Medical supplies running out.", loc: { lat: 22.8, lng: 79.1 } },
      { raw_input: "Building collapse. Multiple casualties. Need urgent rescue and medical.", loc: { lat: 20.1, lng: 79.9 } }
    ];

    const createdTasks = [];

    for (let data of dummyReports) {
      const { processed_type, urgency_score } = simulateAI(data.raw_input);
      const report = new Report({ raw_input: data.raw_input, processed_type, urgency_score, location: data.loc });
      await report.save();

      const task = new Task({
        title: `CRITICAL: ${processed_type.toUpperCase()} CRISIS`,
        type: processed_type,
        priority: urgency_score > 90 ? urgency_score : urgency_score + 20, // ensure they are critical
        location: data.loc,
        status: 'pending'
      });
      await task.save();

      io.emit('new_report', report);
      io.emit('new_task', task);
      createdTasks.push(task);
    }

    res.status(201).json({ message: 'Simulation triggered', tasks: createdTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
