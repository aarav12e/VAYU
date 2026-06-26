require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { Server } = require('socket.io');

const { runDataIngestion } = require('./jobs/dataIngestion');

const aqiRoutes = require('./routes/aqi');
const forecastRoutes = require('./routes/forecast');
const enforcementRoutes = require('./routes/enforcement');
const citizenRoutes = require('./routes/citizen');

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/vayu_intelligence';

// --- App + HTTP server + Socket.io ---------------------------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Make io available to routes (e.g. enforcement dispatch broadcasts)
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// --- Health / root --------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({
    name: 'Vayu Intelligence API',
    status: 'live',
    message: '🌬️ Predictive Intervention Engine for Urban Air Quality',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: ['/api/aqi', '/api/forecast', '/api/enforcement', '/api/citizen'],
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// --- API routes -----------------------------------------------------------
app.use('/api/aqi', aqiRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/enforcement', enforcementRoutes);
app.use('/api/citizen', citizenRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Socket.io ------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('subscribe_city', (city) => {
    if (!city) return;
    // Leave previously joined city rooms before joining a new one
    for (const room of socket.rooms) {
      if (room.startsWith('city:')) socket.leave(room);
    }
    socket.join(`city:${city}`);
    console.log(`   ↳ ${socket.id} subscribed to ${city}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// --- Boot -----------------------------------------------------------------
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🍃 MongoDB connected:', MONGODB_URI);

    // Seed immediately so the demo has data the moment it loads
    runDataIngestion(io).catch((e) => console.error('Initial ingestion failed:', e.message));

    // Refresh live AQI every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      runDataIngestion(io).catch((e) => console.error('Cron ingestion failed:', e.message));
    });
    console.log('⏱️  Data ingestion cron scheduled (every 15 min)');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   The API will still start, but data endpoints need MongoDB running.');
    console.error('   Start MongoDB locally (mongod) or via: docker-compose up mongodb');
  }

  server.listen(PORT, () => {
    console.log(`\n🌬️  Vayu Intelligence API running on http://localhost:${PORT}`);
    console.log(`   Socket.io ready · AI service: ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}\n`);
  });
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down Vayu Intelligence...');
  await mongoose.connection.close().catch(() => {});
  server.close(() => process.exit(0));
});

module.exports = { app, server, io };
