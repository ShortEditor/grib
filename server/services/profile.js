const Groq = require('groq-sdk');
const { dumps, profiles } = require('../db');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Update profile every N dumps
const UPDATE_EVERY = 5;

/**
 * Check if profile needs updating and do it in background
 */
async function maybeUpdateProfile(userId) {
  try {
    const totalDumps = await dumps.countAsync({ userId });

    // Get current profile
    const existing = await profiles.findOneAsync({ userId });
    const lastCount = existing?.dumpCountAtLastUpdate || 0;

    // Update if we've hit a new multiple of UPDATE_EVERY
    const shouldUpdate =
      totalDumps >= UPDATE_EVERY &&
      Math.floor(totalDumps / UPDATE_EVERY) > Math.floor(lastCount / UPDATE_EVERY);

    if (!shouldUpdate) return;

    console.log(`🧠 Updating profile for user ${userId} (${totalDumps} dumps)...`);

    // Fetch last 30 dumps for profile extraction
    const recentDumps = await dumps
      .findAsync({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const dumpText = recentDumps
      .map((d) => {
        const date = new Date(d.createdAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
        });
        return `${date}: "${d.content}"`;
      })
      .join('\n');

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // cheap + fast
      messages: [
        {
          role: 'system',
          content: `You extract a clear, honest psychological and personal profile of someone based on their raw thoughts. Write in second person ("You are..."). Be specific, not generic. Pull real details from what they wrote. No fluff, no padding.`,
        },
        {
          role: 'user',
          content: `Based on these brain dumps, write a 4-6 sentence profile of this person. Be specific — mention their actual projects, interests, personality, communication style, and what they seem to care about. Write it as if briefing someone who's about to have a deep conversation with them.\n\nDumps:\n${dumpText}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    const profileText = response.choices[0]?.message?.content?.trim();
    if (!profileText) return;

    // Upsert profile
    if (existing) {
      await profiles.updateAsync(
        { userId },
        { $set: { profile: profileText, dumpCountAtLastUpdate: totalDumps, updatedAt: new Date() } },
        {}
      );
    } else {
      await profiles.insertAsync({
        userId,
        profile: profileText,
        dumpCountAtLastUpdate: totalDumps,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
    }

    console.log(`✅ Profile updated for user ${userId}`);
  } catch (err) {
    console.error('Profile update failed:', err.message);
  }
}

/**
 * Get current profile text for a user (returns null if none yet)
 */
async function getUserProfile(userId) {
  try {
    const p = await profiles.findOneAsync({ userId });
    return p?.profile || null;
  } catch {
    return null;
  }
}

module.exports = { maybeUpdateProfile, getUserProfile };
