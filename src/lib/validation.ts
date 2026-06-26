import { z } from 'zod';

// ── Auth ──────────────────────────────────

export const phoneSchema = z
  .string()
  .min(8, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(/^\+?[0-9\s-]+$/, 'Invalid phone number format');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^[0-9]+$/, 'OTP must contain only numbers');

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userOtpRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const userOtpVerifySchema = z.object({
  email: z.string().email('Invalid email address'),
  code: otpSchema,
});

// ── Generic ───────────────────────────────

export const accessCodeSchema = z
  .string()
  .min(6, 'Code too short')
  .max(20, 'Code too long')
  .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and dashes');

export const paymentIntakeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3-letter code'),
  method: z.string().optional(),
  reference: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(200),
});

// ── Pagination & Filtering ────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

// ── Country CRUD ──────────────────────────

export const countryCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  code: z.string().length(2, 'ISO code must be 2 characters').toUpperCase(),
  currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
  paymentNotes: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const countryUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100).optional(),
  code: z.string().length(2).toUpperCase().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  paymentNotes: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

// ── Plan CRUD ─────────────────────────────

export const planCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
  maxDevices: z.coerce.number().int().min(1, 'Max devices must be at least 1').default(1),
  isActive: z.boolean().default(true),
});

export const planUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  durationDays: z.coerce.number().int().min(1).optional(),
  maxDevices: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

// ── Event CRUD ────────────────────────────

export const eventCreateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with dashes'),
  category: z.string().min(1, 'Category is required').max(50),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const eventUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/).optional(),
  category: z.string().min(1).max(50).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  posterUrl: z.string().url().nullable().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

// ── Price CRUD ────────────────────────────

export const priceCreateSchema = z.object({
  planId: z.string().min(1, 'Plan is required'),
  countryId: z.string().min(1, 'Country is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').toUpperCase(),
  whopPlanId: z.string().max(100).optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const priceUpdateSchema = z.object({
  id: z.string(),
  amount: z.coerce.number().positive().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  whopPlanId: z.string().max(100).optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// ── Payment Review ────────────────────────

export const paymentReviewSchema = z.object({
  id: z.string(),
  status: z.enum(['approved', 'rejected']),
  reviewNote: z.string().max(500).optional(),
});

// ── Access Code Generation ────────────────

export const codeGenerateSchema = z.object({
  planId: z.string().min(1, 'Plan is required'),
  eventId: z.string().optional(),
  count: z.coerce.number().int().min(1).max(100, 'Max 100 codes at a time').default(1),
  assignedTo: z.string().optional(),
});

// ── Playback Source ───────────────────────

export const playbackSourceCreateSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  matchId: z.string().min(1, 'Match ID is required'),
  sourceProvider: z.string().min(1, 'Source provider is required'),
  sourceMatchId: z.string().min(1, 'Source match ID is required'),
  priority: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const playbackSourceUpdateSchema = z.object({
  id: z.string(),
  matchId: z.string().optional(),
  sourceProvider: z.string().optional(),
  sourceMatchId: z.string().optional(),
  priority: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ── Support Case ──────────────────────────

export const supportCaseUpdateSchema = z.object({
  id: z.string(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  adminNote: z.string().max(1000).optional(),
});
