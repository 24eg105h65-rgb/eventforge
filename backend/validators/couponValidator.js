const { z } = require('zod');

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format.');

const couponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(40),
    description: z.string().trim().max(500).default(''),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.coerce.number().nonnegative('Discount cannot be negative.'),
    maxUses: z.coerce.number().int().min(1).max(10000).default(1),
    validFrom: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    validUntil: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    minimumAmount: z.coerce.number().nonnegative('Minimum amount cannot be negative.').default(0),
    active: z.boolean().default(true),
  }),
});

const couponUpdateSchema = z.object({
  body: z.object({
    code: z.string().trim().min(2).max(40).optional(),
    description: z.string().trim().max(500).optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.coerce.number().nonnegative('Discount cannot be negative.').optional(),
    maxUses: z.coerce.number().int().min(1).max(10000).optional(),
    validFrom: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    validUntil: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
    minimumAmount: z.coerce.number().nonnegative('Minimum amount cannot be negative.').optional(),
    active: z.boolean().optional(),
  }),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
});

const couponParamsSchema = z.object({ params: z.object({ id: objectIdSchema }), query: z.object({}), body: z.object({}).optional() });

module.exports = { couponSchema, couponUpdateSchema, couponParamsSchema };
