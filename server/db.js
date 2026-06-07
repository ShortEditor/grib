const Datastore = require('@seald-io/nedb');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

const users = new Datastore({
  filename: path.join(DB_PATH, 'users.db'),
  autoload: true,
});

const dumps = new Datastore({
  filename: path.join(DB_PATH, 'dumps.db'),
  autoload: true,
});

const chatMessages = new Datastore({
  filename: path.join(DB_PATH, 'chat.db'),
  autoload: true,
});

const profiles = new Datastore({
  filename: path.join(DB_PATH, 'profiles.db'),
  autoload: true,
});

const feedback = new Datastore({
  filename: path.join(DB_PATH, 'feedback.db'),
  autoload: true,
});

// Indexes
users.ensureIndexAsync({ fieldName: 'email', unique: true });
dumps.ensureIndexAsync({ fieldName: 'userId' });
dumps.ensureIndexAsync({ fieldName: 'createdAt' });
chatMessages.ensureIndexAsync({ fieldName: 'userId' });
chatMessages.ensureIndexAsync({ fieldName: 'createdAt' });
profiles.ensureIndexAsync({ fieldName: 'userId', unique: true });
feedback.ensureIndexAsync({ fieldName: 'userId' });

console.log(`✅ NeDB loaded — data stored in: ${DB_PATH}`);

module.exports = { users, dumps, chatMessages, profiles, feedback };
