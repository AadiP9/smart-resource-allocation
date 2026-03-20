const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  priority: { type: Number, default: 0 }, // 0 to 100
  assigned_volunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed'], default: 'pending' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
