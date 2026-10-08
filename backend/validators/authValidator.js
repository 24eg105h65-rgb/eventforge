const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email('Please enter a valid email.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    role: z.enum(['platform_admin', 'organizer', 'staff', 'speaker', 'attendee', 'sponsor']).default('attendee'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Please enter a valid email.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

const meSchema = z.object({
  params: z.object({}),
  query: z.object({}),
});

const updateMeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    avatar: z.string().trim().url('Please enter a valid URL.').optional(),
    interests: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

module.exports = { registerSchema, loginSchema, meSchema, updateMeSchema };
