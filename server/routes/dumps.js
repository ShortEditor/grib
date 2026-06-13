const express = require('express');
const { dumps } = require('../db');
const verifyToken = require('../middleware/auth');
const { detectMoodTag } = require('../services/groq');
const { findRelatedDumps } = require('../services/similarity');
const { maybeUpdateProfile } = require('../services/profile');

const router = express.Router();
router.use(verifyToken);

// POST /api/dumps
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0)
      return res.status(400).json({ error: 'Content cannot be empty' });

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const now = new Date();

    const dump = await dumps.insertAsync({
      userId: req.userId,
      content: content.trim(),
      moodTag: 'random',
      wordCount,
      createdAt: now,
    });

    // Find related dumps (excluding the one just created)
    const existingDumps = await dumps
      .findAsync({ userId: req.userId, _id: { $ne: dump._id } })
      .sort({ createdAt: -1 })
      .limit(200);
    const related = findRelatedDumps(content, existingDumps, 3);

    // Detect mood + update profile in background (non-blocking)
    detectMoodTag(content).then(async (moodTag) => {
      try {
        await dumps.updateAsync({ _id: dump._id }, { $set: { moodTag } }, {});
      } catch (e) {
        console.error('Mood tag update failed:', e.message);
      }
    });

    // Profile update — fires every 5 dumps, silent
    maybeUpdateProfile(req.userId);

    res.status(201).json({ ...dump, related });
  } catch (err) {
    console.error('Create dump error:', err);
    res.status(500).json({ error: 'Failed to save dump' });
  }
});

// GET /api/dumps
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, tag, from, to } = req.query;

    const query = { userId: req.userId };
    if (tag && ['idea', 'rant', 'goal', 'random'].includes(tag)) {
      query.moodTag = tag;
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const lim = parseInt(limit);

    const [allDumps, total] = await Promise.all([
      dumps.findAsync(query).sort({ createdAt: -1 }).skip(skip).limit(lim),
      dumps.countAsync(query),
    ]);

    res.json({
      dumps: allDumps,
      pagination: {
        page: parseInt(page),
        limit: lim,
        total,
        pages: Math.ceil(total / lim),
      },
    });
  } catch (err) {
    console.error('Get dumps error:', err);
    res.status(500).json({ error: 'Failed to fetch dumps' });
  }
});

// GET /api/dumps/search
router.get('/search', async (req, res) => {
  try {
    const { q, tag, from, to } = req.query;
    if (!q || q.trim().length === 0)
      return res.status(400).json({ error: 'Search query is required' });

    const searchRegex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const query = { userId: req.userId, content: searchRegex };

    if (tag && ['idea', 'rant', 'goal', 'random'].includes(tag)) {
      query.moodTag = tag;
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const results = await dumps.findAsync(query).sort({ createdAt: -1 }).limit(30);
    res.json({ dumps: results, query: q.trim() });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// DELETE /api/dumps/:id
router.delete('/:id', async (req, res) => {
  try {
    const numRemoved = await dumps.removeAsync(
      { _id: req.params.id, userId: req.userId },
      {}
    );
    if (numRemoved === 0) return res.status(404).json({ error: 'Dump not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete dump error:', err);
    res.status(500).json({ error: 'Failed to delete dump' });
  }
});

module.exports = router;
