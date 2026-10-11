const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

const rawClientUrl = process.env.CLIENT_URL || '';
// Support comma-separated list of allowed origins.
// Each entry may use a single leading wildcard, e.g. https://*.vercel.app
const allowedOrigins = rawClientUrl
  ? rawClientUrl.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

// Convert a pattern like "https://*.vercel.app" to a RegExp
const toOriginMatcher = (pattern) => {
  if (!pattern.includes('*')) return (origin) => origin === pattern;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+');
  const re = new RegExp(`^${escaped}$`);
  return (origin) => re.test(origin);
};

const matchers = allowedOrigins.map(toOriginMatcher);

const isOriginAllowed = (origin) => {
  // Always allow Vercel preview deployments (any subdomain of vercel.app)
  if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return matchers.some((match) => match(origin));
};

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl requests (no Origin header)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      if (isOriginAllowed(cleanOrigin) || process.env.NODE_ENV !== 'production') {
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
