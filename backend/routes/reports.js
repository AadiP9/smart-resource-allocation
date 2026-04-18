'use strict';
const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const speech = require('@google-cloud/speech');
const router = express.Router();

const Report = require('../models/Report');
const Task = require('../models/Task');
const { analyzeWithGemini } = require('../services/geminiService');

// Multer — store uploads in memory (no disk write needed)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Google Cloud clients — credentials loaded via GOOGLE_APPLICATION_CREDENTIALS env var
const visionClient = new vision.ImageAnnotatorClient();
const speechClient = new speech.SpeechClient();

// ---------------------------------------------------------------------------
// Helper: build GeoJSON coordinates from lat/lng numbers
// ---------------------------------------------------------------------------
function toGeoJSON(lat, lng) {
  return { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
}

// ---------------------------------------------------------------------------
// POST /api/reports
// Accepts raw text + location, runs Gemini NLP, creates Report + Task
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const io = req.app.get('io');
  try {
    const { raw_input, location } = req.body;
    if (!raw_input || !location?.lat || !location?.lng) {
      return res.status(400).json({ error: 'raw_input and location (lat, lng) are required.' });
    }

    const { processed_type, urgency_score, reasoning } = await analyzeWithGemini(raw_input);

    const geoLocation = toGeoJSON(location.lat, location.lng);

    const report = await Report.create({ raw_input, processed_type, urgency_score, reasoning, location: geoLocation });

    const task = await Task.create({
      title: `${processed_type.toUpperCase()} need detected`,
      type: processed_type,
      priority: urgency_score,
      required_skill: processed_type === 'medical' ? 'first-aid' : '',
      location: geoLocation,
      status: 'pending',
    });

    // Phase 3: named events
    io.emit('new_report', report);
    io.emit('task_created', task);

    res.status(201).json({ message: 'Report processed successfully', report, task });
  } catch (error) {
    console.error('[POST /reports]', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/reports/ocr
// Accepts a multipart image, runs Google Cloud Vision OCR, returns extracted text
// ---------------------------------------------------------------------------
router.post('/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

    const [result] = await visionClient.textDetection({ image: { content: req.file.buffer } });
    const detections = result.textAnnotations;
    const text = detections && detections.length > 0 ? detections[0].description.trim() : '';

    res.json({ text });
  } catch (error) {
    console.error('[POST /reports/ocr]', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/reports/transcribe
// Accepts a multipart audio file (webm/ogg/wav), runs Cloud Speech-to-Text
// ---------------------------------------------------------------------------
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided.' });

    const audioBytes = req.file.buffer.toString('base64');

    // Detect encoding from mimetype
    const mimeToEncoding = {
      'audio/webm': 'WEBM_OPUS',
      'audio/ogg': 'OGG_OPUS',
      'audio/wav': 'LINEAR16',
      'audio/x-wav': 'LINEAR16',
    };
    const encoding = mimeToEncoding[req.file.mimetype] || 'WEBM_OPUS';

    const [response] = await speechClient.recognize({
      audio: { content: audioBytes },
      config: { encoding, sampleRateHertz: 48000, languageCode: 'en-IN' },
    });

    const transcript = response.results
      .map((r) => r.alternatives[0]?.transcript || '')
      .join(' ')
      .trim();

    res.json({ transcript });
  } catch (error) {
    console.error('[POST /reports/transcribe]', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/reports/simulate
// Injects realistic dummy crisis events (uses Gemini NLP)
// ---------------------------------------------------------------------------
router.post('/simulate', async (req, res) => {
  const io = req.app.get('io');
  try {
    const scenarios = [
      { text: 'Massive earthquake damage, thousands trapped. Need medical and rescue teams instantly!', lat: 21.0, lng: 78.5 },
      { text: 'Heavy floods washed away houses. 50 families need food and shelter urgently.', lat: 19.5, lng: 77.2 },
      { text: 'Fire spreading rapidly in sector 4. Medical supplies running out.', lat: 22.8, lng: 79.1 },
      { text: 'Building collapse. Multiple casualties. Need urgent rescue and medical response.', lat: 20.1, lng: 79.9 },
    ];

    const created = [];
    for (const s of scenarios) {
      const { processed_type, urgency_score, reasoning } = await analyzeWithGemini(s.text);
      const geoLocation = toGeoJSON(s.lat, s.lng);

      const report = await Report.create({
        raw_input: s.text,
        processed_type,
        urgency_score: Math.min(100, urgency_score + 10), // bump for simulation drama
        reasoning,
        location: geoLocation,
      });

      const task = await Task.create({
        title: `CRITICAL: ${processed_type.toUpperCase()} CRISIS`,
        type: processed_type,
        priority: Math.min(100, urgency_score + 10),
        required_skill: processed_type === 'medical' || processed_type === 'rescue' ? 'first-aid' : '',
        location: geoLocation,
        status: 'pending',
      });

      io.emit('new_report', report);
      io.emit('task_created', task);
      created.push(task);
    }

    res.status(201).json({ message: 'Simulation triggered', tasks: created });
  } catch (error) {
    console.error('[POST /reports/simulate]', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reports
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).lean();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
