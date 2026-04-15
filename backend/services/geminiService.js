'use strict';
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback keyword-based classifier (used if Gemini API fails)
function keywordFallback(raw_input) {
  const t = raw_input.toLowerCase();
  let processed_type = 'general';
  if (/medical|blood|injur|cholera|doctor|hospital|wound/.test(t)) processed_type = 'medical';
  else if (/rescue|trap|collapse|earthquake|flood|drown/.test(t)) processed_type = 'rescue';
  else if (/food|hunger|starv|malnutri/.test(t)) processed_type = 'food';
  else if (/shelter|homeless|tent|displace|house/.test(t)) processed_type = 'shelter';

  const base = { medical: 75, rescue: 85, food: 50, shelter: 40, general: 20 }[processed_type];
  const urgency_score = Math.min(100, Math.max(0, base + Math.floor(Math.random() * 10) - 5));
  return { processed_type, urgency_score, reasoning: 'Keyword-based fallback classification.' };
}

/**
 * Uses Gemini to extract need type, urgency score, and reasoning from raw crisis text.
 * @param {string} raw_input - Field report text
 * @returns {Promise<{ processed_type: string, urgency_score: number, reasoning: string }>}
 */
async function analyzeWithGemini(raw_input) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an AI triage system for an NGO crisis response platform. 
Analyze the following field report and return ONLY a valid JSON object (no markdown, no code blocks) with these exact keys:
- "processed_type": one of ["food", "medical", "shelter", "rescue", "general"]
- "urgency_score": integer 0-100 (100 = most critical; medical/rescue > food > shelter > general)
- "reasoning": one sentence explanation of the classification

Field report: "${raw_input}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip any accidental markdown code fences
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate the shape
    const validTypes = ['food', 'medical', 'shelter', 'rescue', 'general'];
    if (!validTypes.includes(parsed.processed_type)) parsed.processed_type = 'general';
    parsed.urgency_score = Math.min(100, Math.max(0, parseInt(parsed.urgency_score, 10) || 20));
    parsed.reasoning = parsed.reasoning || '';

    return parsed;
  } catch (err) {
    console.error('[GeminiService] API error, falling back to keyword classifier:', err.message);
    return keywordFallback(raw_input);
  }
}

module.exports = { analyzeWithGemini };
