// =============================================================================
// Muhandes HUB — CRM Zod Schemas
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Add / Update Client
// ---------------------------------------------------------------------------
export const CRMClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.email().optional().or(z.literal('')),
  company: z.string().optional(),
  city_id: z.string().uuid().optional(),
  source: z.enum([
    'bid_award', 'rfq_response', 'direct_hire', 'product_inquiry', 'manual_entry',
  ]).default('manual_entry'),
  pipeline_stage: z.enum([
    'lead', 'in_negotiation', 'active_deal', 'completed', 'repeat',
  ]).default('lead'),
  tags: z.array(z.string().uuid()).default([]),
});

export const UpdateClientSchema = CRMClientSchema.partial().extend({
  client_id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Client Note
// ---------------------------------------------------------------------------
export const ClientNoteSchema = z.object({
  client_id: z.string().uuid(),
  content_ar: z.string().min(1),
  content_en: z.string().optional(),
  linked_entity_type: z.enum(['deal', 'contract', 'project', 'quotation']).optional(),
  linked_entity_id: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------
export const CRMTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366f1'),
});

// ---------------------------------------------------------------------------
// Follow-up Reminder
// ---------------------------------------------------------------------------
export const ReminderSchema = z.object({
  client_id: z.string().uuid(),
  reminder_date: z.string().min(1),
  note: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Kanban
// ---------------------------------------------------------------------------
export const KanbanColumnSchema = z.object({
  deal_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export const KanbanCardSchema = z.object({
  column_id: z.string().uuid(),
  deal_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assignee_name: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  file_urls: z.array(z.string().url()).optional(),
});

export const MoveCardSchema = z.object({
  card_id: z.string().uuid(),
  target_column_id: z.string().uuid(),
  position: z.coerce.number().int().min(0),
});

// ---------------------------------------------------------------------------
// Daily Site Log
// ---------------------------------------------------------------------------
export const DailyLogSchema = z.object({
  deal_id: z.string().uuid(),
  log_date: z.string().min(1),
  weather: z.string().optional(),
  workers_on_site: z.coerce.number().int().min(0).optional(),
  description_ar: z.string().min(5),
  description_en: z.string().optional(),
  issues: z.string().optional(),
  safety_notes: z.string().optional(),
  photo_urls: z.array(z.string().url()).optional(),
});

export type CRMClientInput = z.infer<typeof CRMClientSchema>;
export type ClientNoteInput = z.infer<typeof ClientNoteSchema>;
export type CRMTagInput = z.infer<typeof CRMTagSchema>;

// ---------------------------------------------------------------------------
// Duplicate Detection (Pro+)
// ---------------------------------------------------------------------------
export const DetectDuplicatesSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Merge Clients (Pro+)
// ---------------------------------------------------------------------------
export const MergeClientsSchema = z.object({
  primary_id: z.string().uuid(),
  secondary_id: z.string().uuid(),
});
export type KanbanColumnInput = z.infer<typeof KanbanColumnSchema>;
export type KanbanCardInput = z.infer<typeof KanbanCardSchema>;
export type DailyLogInput = z.infer<typeof DailyLogSchema>;
