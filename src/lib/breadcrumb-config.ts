// =============================================================================
// Breadcrumb Config — static route segment → i18n key mapping
// =============================================================================

/**
 * Maps URL path segments to translation keys.
 *
 * Keys are resolved in order:
 *  1. This static config (for known segments)
 *  2. BreadcrumbContext overrides (for dynamic [id] segments)
 *  3. Raw segment as fallback (capitalized)
 *
 * Translation keys reference:
 *  - `nav.*`        → reused from existing navigation translations
 *  - `breadcrumb.*` → new keys specific to breadcrumbs
 */
export const segmentConfig: Record<string, { key: string; namespace: 'nav' | 'breadcrumb' }> = {
  // ── Root anchors ──────────────────────────────────────────────
  dashboard: { key: 'dashboard', namespace: 'nav' },
  admin: { key: 'admin', namespace: 'breadcrumb' },

  // ── Dashboard segments ────────────────────────────────────────
  projects: { key: 'projects', namespace: 'nav' },
  products: { key: 'products', namespace: 'nav' },
  deals: { key: 'deals', namespace: 'nav' },
  quotations: { key: 'quotations', namespace: 'nav' },
  rfqs: { key: 'rfqs', namespace: 'nav' },
  contracts: { key: 'contracts', namespace: 'nav' },
  crm: { key: 'crm', namespace: 'nav' },
  messages: { key: 'messages', namespace: 'nav' },
  notifications: { key: 'notifications', namespace: 'nav' },
  reviews: { key: 'reviews', namespace: 'nav' },
  analytics: { key: 'analytics', namespace: 'nav' },
  commissions: { key: 'commissions', namespace: 'nav' },
  invitations: { key: 'invitations', namespace: 'nav' },
  settings: { key: 'settings', namespace: 'nav' },
  profile: { key: 'profile', namespace: 'nav' },
  subscription: { key: 'subscription', namespace: 'nav' },
  payments: { key: 'payments', namespace: 'nav' },

  // ── Action/sub-page segments ──────────────────────────────────
  new: { key: 'new', namespace: 'breadcrumb' },
  edit: { key: 'edit', namespace: 'breadcrumb' },
  bid: { key: 'bid', namespace: 'breadcrumb' },
  bids: { key: 'bids', namespace: 'breadcrumb' },
  kanban: { key: 'kanban', namespace: 'breadcrumb' },
  'daily-log': { key: 'dailyLog', namespace: 'breadcrumb' },
  milestones: { key: 'milestones', namespace: 'breadcrumb' },
  proofs: { key: 'proofs', namespace: 'breadcrumb' },

  // ── Admin segments ────────────────────────────────────────────
  users: { key: 'users', namespace: 'breadcrumb' },
  registrations: { key: 'registrations', namespace: 'breadcrumb' },
  posts: { key: 'posts', namespace: 'breadcrumb' },
  subscriptions: { key: 'subscriptions', namespace: 'breadcrumb' },
  'audit-log': { key: 'auditLog', namespace: 'breadcrumb' },
  contacts: { key: 'contacts', namespace: 'breadcrumb' },

  // ── Public segments ───────────────────────────────────────────
  marketplace: { key: 'marketplace', namespace: 'nav' },
  partners: { key: 'partners', namespace: 'nav' },
  pricing: { key: 'pricing', namespace: 'nav' },
  contact: { key: 'contact', namespace: 'nav' },
  terms: { key: 'terms', namespace: 'nav' },
  privacy: { key: 'privacy', namespace: 'nav' },
  cookies: { key: 'cookies', namespace: 'nav' },
};

/**
 * Route groups that should be stripped from the pathname before processing.
 */
export const routeGroups = ['(dashboard)', '(admin)', '(public)', '(auth)'];

/**
 * Segments that should be hidden from the breadcrumb trail.
 * 'dashboard' is shown as its own root crumb with a link.
 */
export const hiddenSegments = new Set<string>([]);
