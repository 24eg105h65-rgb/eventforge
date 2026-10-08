const { z } = require('zod');
const mongoose = require('mongoose');

const sessionSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(180),
    description: z.string().trim().max(8000).default(''),
    sessionType: z.enum(['keynote', 'workshop', 'panel', 'talk', 'networking', 'breakout', 'fireside-chat', 'other']).default('other'),
    venue: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid venue ID.'),
    speakers: z.array(z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid speaker ID.')).default([]),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    capacity: z.number().int().positive().optional(),
    status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']).default('draft'),
    track: z.string().trim().max(120).default(''),
    tags: z.array(z.string().trim().min(1)).default([]),
    materials: z.array(z.string().trim().min(1)).default([]),
    livestreamUrl: z.string().trim().max(500).default(''),
    recordingUrl: z.string().trim().max(500).default(''),
  }),
});

const sessionUpdateSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(180).optional(),
    description: z.string().trim().max(8000).optional(),
    sessionType: z.enum(['keynote', 'workshop', 'panel', 'talk', 'networking', 'breakout', 'fireside-chat', 'other']).optional(),
    venue: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid venue ID.').optional(),
    speakers: z.array(z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid speaker ID.')).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    capacity: z.number().int().positive().optional(),
    status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']).optional(),
    track: z.string().trim().max(120).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    materials: z.array(z.string().trim().min(1)).optional(),
    livestreamUrl: z.string().trim().max(500).optional(),
    recordingUrl: z.string().trim().max(500).optional(),
  }),
});

const sessionParamsSchema = z.object({
  params: z.object({
    id: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid event ID.'),
  }),
});

const sessionIdSchema = z.object({
  params: z.object({
    id: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid session ID.'),
  }),
});

const scheduleQuerySchema = z.object({
  query: z.object({
    date: z.string().optional(),
    venue: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid venue ID.').optional(),
    sessionType: z.enum(['keynote', 'workshop', 'panel', 'talk', 'networking', 'breakout', 'fireside-chat', 'other']).optional(),
    status: z.enum(['draft', 'scheduled', 'live', 'completed', 'cancelled']).optional(),
    search: z.string().trim().max(80).optional(),
  }),
});

module.exports = { sessionSchema, sessionUpdateSchema, sessionParamsSchema, sessionIdSchema, scheduleQuerySchema };
