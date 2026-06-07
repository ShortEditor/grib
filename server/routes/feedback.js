const express = require('express');
const Groq = require('groq-sdk');
const { chatMessages, feedback } = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/feedback — save thumbs up/down for a message
router.post('/', async (req, res) => {
  try {
    const { messageId, rating } = req.body;
    if (!messageId || !['up', 'down'].includes(rating))
      return res.status(400).json({ error: 'messageId and rating ("up" or "down") are required' });

    // Look up the original message content
    const message = await chatMessages.findOneAsync({ _id: messageId, userId: req.userId });
    if (!message)
      return res.status(404).json({ error: 'Message not found' });

    // Upsert: one rating per user per message
    const existing = await feedback.findOneAsync({ userId: req.userId, messageId, type: 'rating' });
    if (existing) {
      await feedback.updateAsync(
        { _id: existing._id },
        { $set: { rating, updatedAt: new Date() } }
      );
    } else {
      await feedback.insertAsync({
        userId: req.userId,
        messageId,
        messageContent: message.content,
        rating,
        type: 'rating',
        createdAt: new Date(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// GET /api/feedback/preferences — returns learned style preferences
router.get('/preferences', async (req, res) => {
  try {
    // Get all 'up' rated messages
    const upRatings = await feedback.findAsync({
      userId: req.userId,
      type: 'rating',
      rating: 'up',
    }).sort({ createdAt: -1 });

    if (upRatings.length === 0)
      return res.json({ preferences: null });

    // Check if cached preferences are still fresh
    const prefsDoc = await feedback.findOneAsync({ userId: req.userId, type: 'preferences' });
    const latestRating = upRatings[0].updatedAt || upRatings[0].createdAt;

    if (prefsDoc && prefsDoc.generatedAt >= latestRating) {
      return res.json({ preferences: prefsDoc.preferences });
    }

    // Extract style preferences via Groq
    const likedMessages = upRatings
      .map((r) => `"${r.messageContent}"`)
      .slice(0, 20)
      .join('\n');

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: `Here are AI responses that a user liked (thumbs up). Analyze the tone, length, and style of these messages and write a 2-3 sentence summary of the style this person prefers. Be specific about tone, formality, humor, length, and structure preferences.\n\nLiked messages:\n${likedMessages}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const preferences = response.choices[0]?.message?.content?.trim() || null;

    // Cache the result
    if (prefsDoc) {
      await feedback.updateAsync(
        { _id: prefsDoc._id },
        { $set: { preferences, generatedAt: new Date() } }
      );
    } else {
      await feedback.insertAsync({
        userId: req.userId,
        type: 'preferences',
        preferences,
        generatedAt: new Date(),
      });
    }

    res.json({ preferences });
  } catch (err) {
    console.error('Preferences error:', err);
    res.status(500).json({ error: 'Failed to generate preferences' });
  }
});

module.exports = router;
