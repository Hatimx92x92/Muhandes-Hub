// =============================================================================
// Muhandes HUB — Shared PDF Styles & Helpers
// =============================================================================

import { StyleSheet, Font } from '@react-pdf/renderer';

// Register a system font that supports Arabic + Latin
// Using Noto Sans Arabic which has wide Unicode coverage
Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-400-normal.woff',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@5.0.0/files/noto-sans-arabic-arabic-700-normal.woff',
      fontWeight: 700,
    },
  ],
});

export const colors = {
  primary: '#0f766e',
  primaryLight: '#e0f2f1',
  text: '#1a1a1a',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff',
  muted: '#f9fafb',
  success: '#16a34a',
  destructive: '#dc2626',
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    padding: 40,
    color: colors.text,
    backgroundColor: colors.background,
  },
  pageRTL: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    padding: 40,
    color: colors.text,
    backgroundColor: colors.background,
    direction: 'rtl',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  // Section
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Table
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 24,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 24,
    backgroundColor: colors.muted,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
  },
  // Info grid (2 columns)
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoBox: {
    width: '48%',
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: colors.textMuted,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 10,
    color: colors.text,
  },
  // Totals
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 3,
    width: 250,
  },
  totalsLabel: {
    fontSize: 9,
    color: colors.textMuted,
    width: 130,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 700,
    width: 120,
    textAlign: 'right',
  },
  totalsFinal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 6,
    width: 250,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: 4,
  },
  totalsFinalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.primary,
    width: 130,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalsFinalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: colors.primary,
    width: 120,
    textAlign: 'right',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: colors.textMuted,
  },
  // Badge
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 700,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  badgeDraft: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  // Paragraph
  paragraph: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  // Bilingual block
  bilingualBlock: {
    marginBottom: 8,
  },
  bilingualAr: {
    fontSize: 9,
    color: colors.text,
    lineHeight: 1.5,
    textAlign: 'right',
    direction: 'rtl',
  },
  bilingualEn: {
    fontSize: 9,
    color: colors.textMuted,
    lineHeight: 1.5,
    marginTop: 2,
  },
  // Signature
  signatureBlock: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    minHeight: 80,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 4,
  },
  signatureTitle: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 8,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 20,
    paddingBottom: 4,
  },
  signatureDate: {
    fontSize: 7,
    color: colors.textMuted,
    marginTop: 4,
  },
});

/** Format number as SAR for PDF (simple, non-locale) */
export function formatPdfSAR(amount: number): string {
  return `SAR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format date for PDF */
export function formatPdfDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
