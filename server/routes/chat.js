const express = require('express');
const { dumps, chatMessages, feedback } = require('../db');
const verifyToken = require('../middleware/auth');
const { getChatResponse } = require('../services/groq');
const { getUserProfile } = require('../services/profile');

const router = express.Router();
router.use(verifyToken);

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0)
      return res.status(400).json({ error: 'Message cannot be empty' });

    // Fetch last 50 dumps + user profile + style preferences in parallel
    const [recentDumps, history, userProfile, prefsDoc] = await Promise.all([
      dumps.findAsync({ userId: req.userId }).sort({ createdAt: -1 }).limit(50),
      chatMessages.findAsync({ userId: req.userId }).sort({ createdAt: -1 }).limit(20),
      getUserProfile(req.userId),
      feedback.findOneAsync({ userId: req.userId, type: 'preferences' }),
    ]);
    const orderedHistory = history.reverse();
    const stylePreferences = prefsDoc?.preferences || null;

    // Save user message
    await chatMessages.insertAsync({
      userId: req.userId,
      role: 'user',
      content: message.trim(),
      createdAt: new Date(),
    });

    // Get AI response (with profile context + style preferences)
    const aiContent = await getChatResponse(message.trim(), recentDumps, orderedHistory, userProfile, stylePreferences);

    // Save assistant message
    const assistantMsg = await chatMessages.insertAsync({
      userId: req.userId,
      role: 'assistant',
      content: aiContent,
      createdAt: new Date(),
    });

    res.json({ message: assistantMsg });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed. Check your Groq API key.' });
  }
});

// GET /api/chat/history
router.get('/history', async (req, res) => {
  try {
    const messages = await chatMessages
      .findAsync({ userId: req.userId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// DELETE /api/chat/history
router.delete('/history', async (req, res) => {
  try {
    await chatMessages.removeAsync({ userId: req.userId }, { multi: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

module.exports = router;
