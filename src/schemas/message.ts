// =============================================================================
// Muhandes HUB — Message & Notification Schemas (Zod v4)
// =============================================================================

import { z } from 'zod/v4';

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/** Schema for sending a message */
export const MessageSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  content: z
    .string()
    .max(5000, 'Message content is too long')
    .optional()
    .default(''),
  file_url: z.string().url().optional(),
  file_name: z.string().max(255).optional(),
  file_size: z.coerce.number().int().min(0).optional(),
});

/** Schema for creating a conversation */
export const CreateConversationSchema = z.object({
  participant_id: z.string().uuid('Invalid participant ID'),
  context_type: z.enum(['project', 'product', 'deal']).optional(),
  context_id: z.string().uuid('Invalid context ID').optional(),
  initial_message: z
    .string()
    .min(1, 'Initial message is required')
    .max(5000, 'Message content is too long'),
});

/** Schema for quick reply templates */
export const QuickReplySchema = z.object({
  content_ar: z.string().min(1, 'Arabic content is required').max(2000),
  content_en: z.string().min(1, 'English content is required').max(2000),
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/** Schema for updating notification preferences */
export const NotificationPreferenceSchema = z.object({
  notification_type: z.string().min(1, 'Notification type is required'),
  email_enabled: z.coerce.boolean(),
});

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type MessageInput = z.infer<typeof MessageSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type QuickReplyInput = z.infer<typeof QuickReplySchema>;
export type NotificationPreferenceInput = z.infer<typeof NotificationPreferenceSchema>;
