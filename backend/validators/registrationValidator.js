const { z } = require('zod');
const mongoose = require('mongoose');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.');
const registrationStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'WAITLISTED', 'REJECTED', 'CANCELLED']);

const attendeeDetailsSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(160).optional(),
  phone: z.string().trim().max(30).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  dietaryRequirements: z.string().trim().max(500).optional(),
  specialRequirements: z.string().trim().max(1000).optional(),
}).default({});

const registrationSchema = z.object({
  body: z.object({
    ticketId: objectIdSchema,
    quantity: z.coerce.number().int().positive('Quantity must be greater than zero.'),
    attendeeDetails: attendeeDetailsSchema.optional(),
    couponCode: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(2000).optional(),
    unitPrice: z.coerce.number().nonnegative().optional(),
    subtotal: z.coerce.number().nonnegative().optional(),
    discount: z.coerce.number().nonnegative().optional(),
    totalAmount: z.coerce.number().nonnegative().optional(),
  }),
});

const registrationUpdateSchema = z.object({
  body: z.object({
    status: registrationStatusSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
  }),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
});

const registrationParamsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  body: z.object({}).optional(),
});

const registrationListQuery = z.object({
  params: z.object({ id: objectIdSchema }),
  query: z.object({
    status: registrationStatusSchema.optional(),
    ticket: objectIdSchema.optional(),
    search: z.string().trim().max(80).optional(),
  }),
  body: z.object({}).optional(),
});

module.exports = { registrationSchema, registrationUpdateSchema, registrationParamsSchema, registrationListQuery };
