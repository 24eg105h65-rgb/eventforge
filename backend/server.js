require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`EventForge API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start EventForge API:', error.message);
    process.exit(1);
  }
};

startServer();
