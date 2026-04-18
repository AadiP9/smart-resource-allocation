'use strict';
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    raw_input: { type: String, required: true },
    processed_type: { type: String, default: 'general' },
    urgency_score: { type: Number, default: 0 }, // 0–100
    reasoning: { type: String, default: '' }, // Gemini explanation
    // GeoJSON Point — coordinates: [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
  },
  { timestamps: true }
);

reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);
