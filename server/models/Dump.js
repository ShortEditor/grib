const mongoose = require('mongoose');

const dumpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
    moodTag: {
      type: String,
      enum: ['idea', 'rant', 'goal', 'random'],
      default: 'random',
    },
    wordCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text search index
dumpSchema.index({ content: 'text' });

module.exports = mongoose.model('Dump', dumpSchema);
