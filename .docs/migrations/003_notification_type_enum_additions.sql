-- Add 4 subscription notification types that exist in TypeScript enums but were missing from the DB enum.
-- These were causing silent failures when trigger functions tried to insert notifications of these types.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_upgraded';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_renewed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_payment_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'subscription_payment_rejected';
