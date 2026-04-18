'use strict';
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'volunteer', 'field_worker'],
      required: true,
    },
    skills: [{ type: String }],
    available: { type: Boolean, default: true },
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

// 2dsphere index required for MongoDB geospatial ($near) queries
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
