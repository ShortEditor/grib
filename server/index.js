require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

// Init DB first
require('./db');

const authRoutes = require('./routes/auth');
const dumpsRoutes = require('./routes/dumps');
const chatRoutes = require('./routes/chat');
const insightsRoutes = require('./routes/insights');
const feedbackRoutes = require('./routes/feedback');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://172.29.179.20:5173', // phone on same WiFi
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dumps', dumpsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/feedback', feedbackRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'GRIB' }));

// Start cloud sync (pulls mobile dumps on startup + every 5 min)
const { startSync } = require('./services/sync');
startSync();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 GRIB server running on http://localhost:${PORT}`));
