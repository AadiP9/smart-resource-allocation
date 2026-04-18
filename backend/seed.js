'use strict';
// Seed script — clears existing data and inserts GeoJSON-compatible demo records
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Report = require('./models/Report');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('[Seed] Connected to MongoDB.');
    await Promise.all([User.deleteMany({}), Task.deleteMany({}), Report.deleteMany({})]);
    console.log('[Seed] Cleared existing documents.');
    await seed();
    console.log('[Seed] Done.');
    process.exit(0);
  })
  .catch((err) => { console.error('[Seed] Connection error:', err); process.exit(1); });

// GeoJSON helper: [longitude, latitude]
const geo = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });

async function seed() {
  // --- Users ---
  const [volunteer1, volunteer2, volunteer3] = await User.insertMany([
    { name: 'Rahul Singh',   role: 'volunteer', skills: ['first-aid', 'driving'],  available: true, location: geo(20.5, 78.8) },
    { name: 'Priya Sharma',  role: 'volunteer', skills: ['first-aid', 'medicine'], available: true, location: geo(21.2, 79.3) },
    { name: 'Amit Verma',    role: 'volunteer', skills: ['logistics', 'driving'],  available: true, location: geo(19.8, 77.5) },
    { name: 'Field Worker 1',role: 'field_worker', skills: [], available: true, location: geo(20.0, 78.0) },
    { name: 'Admin User',    role: 'admin',     skills: [], available: true, location: geo(20.5, 78.9) },
  ]);
  console.log('[Seed] Users created.');

  // --- Reports ---
  await Report.insertMany([
    {
      raw_input: 'Flood waters rising, 5 families trapped. Need boats and emergency shelter.',
      processed_type: 'rescue', urgency_score: 92,
      reasoning: 'Rescue situation with trapped persons — highest priority.',
      location: geo(21.5, 79.2),
    },
    {
      raw_input: 'Running low on food supplies for 50 people after landslide.',
      processed_type: 'food', urgency_score: 55,
      reasoning: 'Food shortage post-disaster — medium priority.',
      location: geo(19.8, 77.5),
    },
    {
      raw_input: 'Cholera outbreak reported. Need medical supplies and doctors immediately.',
      processed_type: 'medical', urgency_score: 88,
      reasoning: 'Disease outbreak with immediate health risk — high priority.',
      location: geo(22.1, 80.0),
    },
  ]);
  console.log('[Seed] Reports created.');

  // --- Tasks ---
  await Task.insertMany([
    {
      title: 'Rescue Mission: Flood Trap',
      type: 'rescue', priority: 92,
      required_skill: 'first-aid',
      location: geo(21.5, 79.2),
      status: 'pending',
    },
    {
      title: 'Deliver Food Supplies',
      type: 'food', priority: 55,
      required_skill: 'logistics',
      location: geo(19.8, 77.5),
      status: 'pending',
    },
    {
      title: 'Medical Emergency Camp',
      type: 'medical', priority: 88,
      required_skill: 'first-aid',
      location: geo(22.1, 80.0),
      status: 'in_progress',
      assigned_volunteer: volunteer2._id,
    },
  ]);
  console.log('[Seed] Tasks created.');
}
