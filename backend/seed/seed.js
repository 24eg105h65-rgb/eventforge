require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_PASSWORD = 'EventForge2026!';
const users = [
  { name: 'Platform Admin', email: 'admin@eventforge.demo', role: 'platform_admin' },
  { name: 'Event Organizer', email: 'organizer@eventforge.demo', role: 'organizer' },
  { name: 'Event Staff', email: 'staff@eventforge.demo', role: 'staff' },
  { name: 'Conference Speaker', email: 'speaker@eventforge.demo', role: 'speaker' },
  { name: 'Event Attendee', email: 'attendee@eventforge.demo', role: 'attendee' },
  { name: 'Event Sponsor', email: 'sponsor@eventforge.demo', role: 'sponsor' },
];

const seedDemoUsers = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to seed demo users.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const results = await Promise.all(
    users.map(async (user) => {
      const existingUser = await User.findOne({ email: user.email.toLowerCase() });

      if (existingUser) {
        return { email: user.email, status: 'existing' };
      }

      const createdUser = await User.create({
        ...user,
        email: user.email.toLowerCase(),
        password: DEMO_PASSWORD,
      });

      return { email: createdUser.email, status: 'created' };
    }),
  );

  console.log('Demo users:', results);
  await mongoose.disconnect();
};

seedDemoUsers().catch((error) => {
  console.error('Demo user seeding failed:', error.message);
  process.exitCode = 1;
});
