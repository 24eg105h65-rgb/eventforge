const { z } = require('zod');
const mongoose = require('mongoose');

const venueSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(4000).default(''),
    building: z.string().trim().max(120).default(''),
    floor: z.string().trim().max(40).default(''),
    roomNumber: z.string().trim().max(60).default(''),
    address: z.string().trim().max(300).default(''),
    capacity: z.number().int().positive(),
    facilities: z.array(z.string().trim().min(1)).default([]),
    seatingType: z.enum(['theatre', 'classroom', 'boardroom', 'u-shape', 'banquet', 'standing', 'other']).default('other'),
    isActive: z.boolean().default(true),
  }),
});

const venueUpdateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(4000).optional(),
    building: z.string().trim().max(120).optional(),
    floor: z.string().trim().max(40).optional(),
    roomNumber: z.string().trim().max(60).optional(),
    address: z.string().trim().max(300).optional(),
    capacity: z.number().int().positive().optional(),
    facilities: z.array(z.string().trim().min(1)).optional(),
    seatingType: z.enum(['theatre', 'classroom', 'boardroom', 'u-shape', 'banquet', 'standing', 'other']).optional(),
    isActive: z.boolean().optional(),
  }),
});

const venueParamsSchema = z.object({
  params: z.object({
    id: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid event ID.'),
  }),
});

const venueIdSchema = z.object({
  params: z.object({
    id: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid venue ID.'),
  }),
});

module.exports = { venueSchema, venueUpdateSchema, venueParamsSchema, venueIdSchema };
