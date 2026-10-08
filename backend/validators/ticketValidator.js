const { z } = require('zod');
const mongoose = require('mongoose');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.');
const ticketTypeSchema = z.enum(['FREE', 'PAID', 'VIP', 'EARLY_BIRD', 'STUDENT', 'CORPORATE', 'GROUP', 'CUSTOM']);

const ticketSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Ticket name is required.').max(180),
    description: z.string().trim().max(4000).default(''),
    type: ticketTypeSchema.default('PAID'),
    price: z.coerce.number().nonnegative('Price cannot be negative.'),
    currency: z.string().trim().min(3).max(10).default('INR').transform((value) => value.toUpperCase()),
    capacity: z.coerce.number().int().positive('Capacity must be greater than zero.'),
    saleStart: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    saleEnd: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    active: z.boolean().default(true),
    requiresApproval: z.boolean().default(false),
    maxPerAttendee: z.coerce.number().int().min(1).max(100).default(1),
    metadata: z.record(z.any()).optional(),
  }),
});

const ticketUpdateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Ticket name is required.').max(180).optional(),
    description: z.string().trim().max(4000).optional(),
    type: ticketTypeSchema.optional(),
    price: z.coerce.number().nonnegative('Price cannot be negative.').optional(),
    currency: z.string().trim().min(3).max(10).optional().transform((value) => value?.toUpperCase()),
    capacity: z.coerce.number().int().positive('Capacity must be greater than zero.').optional(),
    saleStart: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    saleEnd: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    active: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    maxPerAttendee: z.coerce.number().int().min(1).max(100).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
});

const ticketParamsSchema = z.object({ params: z.object({ id: objectIdSchema }), query: z.object({}), body: z.object({}).optional() });

module.exports = { ticketSchema, ticketUpdateSchema, ticketParamsSchema };
