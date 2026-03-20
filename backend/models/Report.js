const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  raw_input: { type: String, required: true },
  processed_type: { type: String }, // e.g., food, medical, shelter
  urgency_score: { type: Number, default: 0 }, // 0 to 100
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
