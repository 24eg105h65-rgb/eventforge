const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.');
const eventTypeSchema = z.enum(['conference', 'workshop', 'exhibition', 'seminar', 'networking', 'corporate', 'summit', 'other']);
const statusSchema = z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']);
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(?::\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/)
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Please enter a valid date.')
  .transform((value) => new Date(value));

const eventPayload = z.object({
  name: z.string().trim().min(2, 'Event name is required.').max(180),
  description: z.string().trim().max(8000).default(''),
  eventType: eventTypeSchema.default('other'),
  status: statusSchema.default('draft'),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  timezone: z.string().trim().min(1).max(100).default('UTC'),
  venue: z.string().trim().max(180).default(''),
  address: z.string().trim().max(300).default(''),
  city: z.string().trim().max(100).default(''),
  country: z.string().trim().max(100).default(''),
  capacity: z.coerce.number().int().positive('Capacity must be greater than zero.'),
  registrationOpen: dateStringSchema.nullable().optional(),
  registrationClose: dateStringSchema.nullable().optional(),
  bannerImage: z.string().trim().max(500).optional().default(''),
  logo: z.string().trim().max(500).optional().default(''),
  organizer: objectIdSchema.optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  website: z.string().trim().url('Please enter a valid website URL.').or(z.literal('')).default(''),
  contactEmail: z.string().trim().email('Please enter a valid contact email.').or(z.literal('')).default(''),
});

const eventSchema = z.object({
  body: eventPayload,
});

const eventParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  body: z.object({}).optional(),
});

const listQuerySchema = z.object({
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: statusSchema.optional(),
    eventType: eventTypeSchema.optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  }),
  body: z.object({}).optional(),
});

const eventUpdateSchema = z.object({
  body: eventPayload.partial(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
});

module.exports = {
  eventSchema,
  eventParamsSchema,
  eventUpdateSchema,
  listQuerySchema,
};
