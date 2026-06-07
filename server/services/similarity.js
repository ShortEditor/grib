const STOP_WORDS = new Set([
  'the','a','an','is','it','to','i','in','and','or','but','of','for','with',
  'on','at','by','from','that','this','was','are','be','have','do','will',
  'just','its','not','my','me','we','they','you','he','she','so','if','as',
  'up','out','about','what','how','when','where','who','which','there','their',
  'your','our','his','her','has','had','been','can','could','would','should',
  'into','than','then','very','all','also','get','got','did','some','no','more',
  'am','im','dont','cant','wont','ive','its','even','like','want','need','make',
  'think','know','feel','see','look','come','use','one','two','way','time','now',
]);

/**
 * Extract meaningful keywords from text
 */
function getKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
}

/**
 * Jaccard similarity between two texts (0 to 1)
 */
function jaccardSimilarity(textA, textB) {
  const setA = new Set(getKeywords(textA));
  const setB = new Set(getKeywords(textB));
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((w) => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Find top N most similar dumps to a given piece of content
 * Returns array of { dump, score }
 */
function findRelatedDumps(newContent, existingDumps, topN = 3, threshold = 0.08) {
  const scored = existingDumps
    .map((dump) => ({
      dump,
      score: jaccardSimilarity(newContent, dump.content),
    }))
    .filter((d) => d.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map((d) => d.dump);
}

module.exports = { findRelatedDumps };
