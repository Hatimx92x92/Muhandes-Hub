import {
  AlertCircle,
  Bell,
  CheckCircle,
  CreditCard,
  Crown,
  FileCheck,
  FileText,
  Gavel,
  Handshake,
  RefreshCw,
  Send,
  ShieldAlert,
  Star,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NotificationIconConfig {
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const NOTIFICATION_ICONS: Record<string, NotificationIconConfig> = {
  bid_received: { icon: Gavel, colorClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-950' },
  bid_awarded: { icon: Gavel, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  bid_shortlisted: { icon: Gavel, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-100 dark:bg-yellow-950' },
  bid_rejected: { icon: Gavel, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950' },
  inquiry_received: { icon: FileText, colorClass: 'text-purple-600', bgClass: 'bg-purple-100 dark:bg-purple-950' },
  quotation_received: { icon: FileText, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-100 dark:bg-indigo-950' },
  quotation_accepted: { icon: FileText, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  deal_created: { icon: Handshake, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100 dark:bg-emerald-950' },
  deal_status_changed: { icon: Handshake, colorClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-950' },
  deal_completed: { icon: Handshake, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  payment_confirmed: { icon: CreditCard, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  commission_due: { icon: AlertCircle, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-100 dark:bg-yellow-950' },
  commission_overdue: { icon: AlertCircle, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950' },
  review_received: { icon: Star, colorClass: 'text-yellow-500', bgClass: 'bg-yellow-100 dark:bg-yellow-950' },
  subscription_expiring: { icon: Crown, colorClass: 'text-orange-600', bgClass: 'bg-orange-100 dark:bg-orange-950' },
  subscription_expired: { icon: Crown, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950' },
  document_approved: { icon: FileCheck, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  document_rejected: { icon: FileCheck, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950' },
  post_approved: { icon: CheckCircle, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  post_rejected: { icon: CheckCircle, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950' },
  rfq_published: { icon: Send, colorClass: 'text-cyan-600', bgClass: 'bg-cyan-100 dark:bg-cyan-950' },
  rfq_response_received: { icon: Send, colorClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-950' },
  rfq_response_accepted: { icon: Send, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  rfq_response_rejected: { icon: Send, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950' },
  supplier_hire_request_received: { icon: UserPlus, colorClass: 'text-violet-600', bgClass: 'bg-violet-100 dark:bg-violet-950' },
  supplier_hire_quotation_received: { icon: FileText, colorClass: 'text-violet-600', bgClass: 'bg-violet-100 dark:bg-violet-950' },
  deal_flagged_review: { icon: ShieldAlert, colorClass: 'text-orange-600', bgClass: 'bg-orange-100 dark:bg-orange-950' },
  subscription_upgraded: { icon: TrendingUp, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  subscription_renewed: { icon: RefreshCw, colorClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-blue-950' },
  subscription_payment_approved: { icon: CreditCard, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-950' },
  subscription_payment_rejected: { icon: CreditCard, colorClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950' },
};

const FALLBACK: NotificationIconConfig = {
  icon: Bell,
  colorClass: 'text-muted-foreground',
  bgClass: 'bg-muted',
};

export function getNotificationIcon(type: string): NotificationIconConfig {
  return NOTIFICATION_ICONS[type] ?? FALLBACK;
}
