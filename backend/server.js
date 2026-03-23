const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donor');
const adminRoutes = require('./routes/admin');
const bloodRequestRoutes = require('./routes/bloodRequest');
const inventoryRoutes = require('./routes/inventory');
const donationRoutes = require('./routes/donation');
const collegeAdminRoutes = require('./routes/collegeAdmin');
const emergencyRoutes = require('./routes/emergencyRoutes');
const twilioRoutes = require('./routes/twilio');

// Initialize Express app
const app = express();

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will run without database...');
  }
};
connectDB();

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/college-admin', collegeAdminRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/twilio', twilioRoutes);

// ==================== UTILITY ENDPOINTS ====================
// Health check
app.get('/api/health', (req, res) => {
  const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
      database: mongoState
    }
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Lifeblood Connect API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      donors: '/api/donors',
      admin: '/api/admin',
      bloodRequests: '/api/blood-requests',
      inventory: '/api/inventory',
      donations: '/api/donations',
      collegeAdmin: '/api/college-admin',
      emergency: '/api/emergency',
      twilio: '/api/twilio',
      health: '/api/health'
    }
  });
});

// Test route (remove in production)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test', (req, res) => {
    res.json({ 
      success: true,
      message: 'API is working!',
      environment: process.env.NODE_ENV || 'development'
    });
  });
}

// Root redirect to API info
app.get('/', (req, res) => {
  res.redirect('/api');
});

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(40)}`);
  console.log(`🚀  LIFEBLOOD CONNECT SERVER`);
  console.log(`${'='.repeat(40)}`);
  console.log(`📍 Port:       ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Database:    ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`\n📡 API Base:   http://localhost:${PORT}/api`);
  console.log(`\n📡 Available Routes:`);
  console.log(`   • Auth:           /api/auth`);
  console.log(`   • Donors:         /api/donors`);
  console.log(`   • Admin:          /api/admin`);
  console.log(`   • Blood Req:      /api/blood-requests`);
  console.log(`   • Inventory:      /api/inventory`);
  console.log(`   • Donations:      /api/donations`);
  console.log(`   • College Admin:  /api/college-admin`);
  console.log(`   • Emergency:      /api/emergency`);
  console.log(`   • Twilio:         /api/twilio`);
  console.log(`${'='.repeat(40)}\n`);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = app;