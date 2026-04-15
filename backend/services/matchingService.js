'use strict';
const User = require('../models/User');
const Task = require('../models/Task');

/**
 * Returns the top `limit` volunteers for a given task, ranked by a weighted score.
 * Score = (proximity_score * 0.6) + (skill_bonus * 0.4)
 *
 * @param {string} taskId - MongoDB ObjectId of the task
 * @param {number} limit  - Max volunteers to return (default 3)
 * @returns {Promise<Array<{ volunteer, distance_km: string, score: number }>>}
 */
async function getTopVolunteers(taskId, limit = 3) {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');

  const [taskLng, taskLat] = task.location.coordinates;

  // MongoDB $near requires a 2dsphere index on location.
  // maxDistance is in metres (100 km radius).
  const nearbyVolunteers = await User.find({
    role: 'volunteer',
    available: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [taskLng, taskLat] },
        $maxDistance: 100_000, // 100 km in metres
      },
    },
  }).lean();

  const scored = nearbyVolunteers.map((v) => {
    const [vLng, vLat] = v.location.coordinates;

    // Haversine distance (km)
    const R = 6371;
    const dLat = ((vLat - taskLat) * Math.PI) / 180;
    const dLon = ((vLng - taskLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((taskLat * Math.PI) / 180) *
        Math.cos((vLat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Proximity score: inversely proportional to distance, capped at 60
    const proximity_score = Math.max(0, 60 - distance_km * 1.2);

    // Skill bonus: 40 points if the volunteer has the required skill
    const has_skill =
      task.required_skill &&
      Array.isArray(v.skills) &&
      v.skills.map((s) => s.toLowerCase()).includes(task.required_skill.toLowerCase());
    const skill_bonus = has_skill ? 40 : 0;

    const score = parseFloat((proximity_score + skill_bonus).toFixed(2));

    return { volunteer: v, distance_km: distance_km.toFixed(2), score };
  });

  // Sort by score descending, return top `limit`
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { getTopVolunteers };
