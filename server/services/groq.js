const Groq = require('groq-sdk');
const { findRelatedDumps } = require('./similarity');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are GRIB — built from this person's own brain dumps. You ARE their thoughts, not an AI assistant.

RULE #1: MATCH YOUR LENGTH TO THE QUESTION.
- Vibe check, emotions, simple stuff → 1-2 sentences. "yeah that's rough" type energy.
- Real question needing a real answer → give a proper response, 3-6 sentences. Actually help.
- Technical/complex question → explain properly but stay concise. No fluff.

The point: don't give a 1-liner to a serious question. Don't give an essay to "how are you".

Talk like a chill friend texting — lowercase vibes, no formality, no structure. Mirror how THEY write (short, raw, real). Think of how a close homie would reply to a text, not how an AI would.

When they ask about something you know from their dumps, reference it naturally. "you wrote about this before" or "didn't you say X last week?"

NEVER do this:
- Bullet points, headers, lists, structured formatting
- "Great question", "Certainly", "Absolutely", "I'd be happy to"
- Starting with "I"
- Generic motivational speaker advice
- Repeating what they just said back to them

Keep it real. Talk like them.`;

/**
 * Detect mood tag — uses llama-3.1-8b-instant (cheaper, fast enough for classification)
 */
async function detectMoodTag(content) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: `Tag this thought as exactly one word: idea, rant, goal, or random. Reply with only that word.\n\n"${content.slice(0, 200)}"`,
        },
      ],
      max_tokens: 4,
      temperature: 0,
    });

    const tag = response.choices[0]?.message?.content?.trim().toLowerCase();
    const valid = ['idea', 'rant', 'goal', 'random'];
    return valid.includes(tag) ? tag : 'random';
  } catch (err) {
    console.error('Mood detection failed:', err.message);
    return 'random';
  }
}

/**
 * RAG: pick most relevant dumps for the question
 * Returns 3 recent + up to 8 semantically relevant (de-duped), max ~11 total
 */
function selectContext(userMessage, allDumps) {
  if (!allDumps || allDumps.length === 0) return [];

  // Always include 3 most recent (short-term memory)
  const recent = allDumps.slice(0, 3);
  const recentIds = new Set(recent.map((d) => d._id));

  // Semantically relevant to the question (skip ones already in recent)
  const rest = allDumps.filter((d) => !recentIds.has(d._id));
  const relevant = findRelatedDumps(userMessage, rest, 8, 0.05);

  return [...recent, ...relevant];
}

/**
 * Format dumps as clean readable context (not JSON, just prose-style)
 */
function formatContext(dumps) {
  if (!dumps || dumps.length === 0) return 'No past thoughts yet.';
  return dumps
    .map((d) => {
      const date = new Date(d.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
      return `${date}: "${d.content}"`;
    })
    .join('\n');
}

/**
 * Get AI chat response — RAG-powered, human-voiced
 */
async function getChatResponse(userMessage, allDumps, chatHistory = [], userProfile = null, stylePreferences = null) {
  const contextDumps = selectContext(userMessage, allDumps);
  const context = formatContext(contextDumps);

  // Inject context as a system-level note, not a fake user message
  const contextNote = `[Context: here are the most relevant thoughts this person has written. Use these — don't make stuff up.]\n\n${context}`;

  // Last 6 messages of real chat history (3 exchanges)
  const history = chatHistory.slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Inject user profile so the AI knows WHO it's talking to
  const profileNote = userProfile
    ? `[Who you're talking to — this is built from their own words:]\n${userProfile}`
    : null;

  const styleNote = stylePreferences
    ? `[Style preferences — this person has trained you to respond like this:]\n${stylePreferences}`
    : null;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(profileNote ? [{ role: 'system', content: profileNote }] : []),
    ...(styleNote ? [{ role: 'system', content: styleNote }] : []),
    { role: 'system', content: contextNote },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 350,
    temperature: 0.75,
    presence_penalty: 0.5,
  });

  return response.choices[0]?.message?.content?.trim()
    || "something went wrong on my end. try again?";
}

module.exports = { detectMoodTag, getChatResponse };
