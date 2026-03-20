const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Report = require('./models/Report');

const MONGO_URI = 'mongodb://127.0.0.1:27017/sras';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Starting seed...');
    await clearData();
    await seedData();
    console.log('Seeding complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });

async function clearData() {
  await User.deleteMany({});
  await Task.deleteMany({});
  await Report.deleteMany({});
  console.log('Cleared existing data.');
}

async function seedData() {
  // Create Admins and Volunteers
  const volunteer1 = await User.create({ name: 'Rahul Singer', role: 'volunteer', skills: ['driving', 'first-aid'], location: { lat: 20.0, lng: 78.0 } });
  const admin = await User.create({ name: 'Admin User', role: 'admin', location: { lat: 20.0, lng: 78.0 } });

  // Create Reports
  const report1 = await Report.create({ 
    raw_input: 'Flood waters rising, 5 families trapped. Need boats and emergency shelter.', 
    processed_type: 'rescue', 
    urgency_score: 95, 
    location: { lat: 21.5, lng: 79.2 }
  });

  const report2 = await Report.create({ 
    raw_input: 'Running low on food supplies for 50 people.', 
    processed_type: 'food', 
    urgency_score: 55, 
    location: { lat: 19.8, lng: 77.5 }
  });

  const report3 = await Report.create({ 
    raw_input: 'Cholera outbreak, need medical supplies and doctors instantly.', 
    processed_type: 'medical', 
    urgency_score: 85, 
    location: { lat: 22.1, lng: 80.0 }
  });

  // Create corresponding Tasks
  await Task.create({ title: 'Rescue Mission: Flood Trap', type: 'rescue', priority: 95, location: { lat: 21.5, lng: 79.2 }, status: 'pending' });
  await Task.create({ title: 'Deliver Food Supplies', type: 'food', priority: 55, location: { lat: 19.8, lng: 77.5 }, status: 'pending' });
  await Task.create({ title: 'Medical Emergency Camp', type: 'medical', priority: 85, location: { lat: 22.1, lng: 80.0 }, status: 'in_progress', assigned_volunteer: volunteer1._id });

  console.log('Created dummy Reports, Tasks, and Users.');
}
