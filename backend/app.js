const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || false,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EventForge API is running.',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/venues', require('./routes/venueRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api', require('./routes/ticketRoutes'));
app.use('/api', require('./routes/registrationRoutes'));
app.use('/api', require('./routes/couponRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
