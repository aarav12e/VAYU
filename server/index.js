const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { initDataIngestion } = require('./jobs/dataIngestion');

const aqiRoutes = require('./routes/aqi');
const forecastRoutes = require('./routes/forecast');
const enforcementRoutes = require('./routes/enforcement');
const citizenRoutes = require('./routes/citizen');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach io to request
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Connect Database
connectDB();

// API Routes
app.use('/api/aqi', aqiRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/enforcement', enforcementRoutes);
app.use('/api/citizen', citizenRoutes);

// Root & Health Endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'Vayu Intelligence Backend Online 🌬️',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Global Error Handler
app.use(globalErrorHandler);

// Socket.io Handlers
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('subscribe_city', (city) => {
    socket.join(`city:${city}`);
    console.log(`   ↳ ${socket.id} subscribed to ${city}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start Ingestion Cron Worker
initDataIngestion(io);

// Start Server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🌬️  Vayu Intelligence Server running on http://localhost:${PORT}`);
  console.log(`   Socket.io ready · AI service target: ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}\n`);
});
