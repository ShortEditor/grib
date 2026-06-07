const express = require('express');
const { dumps } = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/insights
router.get('/', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDumps = await dumps
      .findAsync({ userId: req.userId, createdAt: { $gte: sevenDaysAgo } })
      .sort({ createdAt: 1 });

    if (recentDumps.length === 0) {
      return res.json({
        period: '7 days',
        totalDumps: 0,
        totalWords: 0,
        moodDistribution: {},
        mostActiveHour: null,
        avgWordsPerDump: 0,
        topHours: [],
        dailyCounts: {},
      });
    }

    // Mood distribution
    const moodDistribution = recentDumps.reduce((acc, d) => {
      acc[d.moodTag] = (acc[d.moodTag] || 0) + 1;
      return acc;
    }, {});

    // Hour distribution
    const hourCounts = {};
    recentDumps.forEach((d) => {
      const hour = new Date(d.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const topHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        label: formatHour(parseInt(hour)),
        count,
      }));

    // Daily counts
    const dailyCounts = {};
    recentDumps.forEach((d) => {
      const day = new Date(d.createdAt).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    const totalWords = recentDumps.reduce((sum, d) => sum + (d.wordCount || 0), 0);

    res.json({
      period: '7 days',
      totalDumps: recentDumps.length,
      totalWords,
      avgWordsPerDump: Math.round(totalWords / recentDumps.length),
      moodDistribution,
      mostActiveHour: topHours[0] || null,
      topHours,
      dailyCounts,
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to compute insights' });
  }
});

function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

module.exports = router;
