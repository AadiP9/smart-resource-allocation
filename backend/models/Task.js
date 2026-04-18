'use strict';
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    priority: { type: Number, default: 0 }, // 0–100
    required_skill: { type: String, default: '' },
    assigned_volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed'],
      default: 'pending',
    },
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

taskSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Task', taskSchema);
