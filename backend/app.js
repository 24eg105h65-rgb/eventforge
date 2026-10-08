const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

const rawClientUrl = process.env.CLIENT_URL || '';
const allowedOrigins = rawClientUrl
  ? rawClientUrl.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');
      const isAllowed = allowedOrigins.some(
        (allowed) => allowed === cleanOrigin || allowed === '*'
      );

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        // Return the normalized origin (no trailing slash) so the
        // Access-Control-Allow-Origin header always matches exactly.
        return callback(null, cleanOrigin);
      }
      return callback(new Error(`CORS policy blocked origin: ${origin}`));
    },
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
