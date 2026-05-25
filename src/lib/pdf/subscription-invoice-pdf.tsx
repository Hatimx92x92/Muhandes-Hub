// =============================================================================
// Muhandes HUB — ZATCA-Compliant Subscription Invoice PDF Template
// =============================================================================

import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, colors, formatPdfSAR, formatPdfDate } from './styles';

export interface SubscriptionInvoiceData {
  invoice_number: string;
  // Subscriber info
  subscriber_name?: string;
  subscriber_vat_number?: string;
  subscriber_cr_number?: string;
  subscriber_address?: string;
  // Platform info (issuer)
  platform_name: string;
  platform_vat_number: string;
  platform_cr_number: string;
  platform_address: string;
  // Subscription details
  tier: string;
  duration_months: number;
  // Financial
  subtotal: number;
  vat_amount: number;
  total: number;
  // Dates
  issue_date: string;
  period_start?: string;
  period_end?: string;
  // Payment
  payment_method?: string;
  paid_at?: string;
}

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter / المبتدئ',
  pro: 'Pro / المحترف',
  business: 'Business / الأعمال',
  enterprise: 'Enterprise / المؤسسات',
};

export function SubscriptionInvoicePdf({ data }: { data: SubscriptionInvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Muhandes HUB</Text>
            <Text style={styles.headerSubtitle}>منصة مقاول هب</Text>
            <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 4 }}>
              B2B Construction Marketplace
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: colors.primary }}>
              TAX INVOICE
            </Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>
              فاتورة ضريبية
            </Text>
            <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>
              Invoice # {data.invoice_number}
            </Text>
          </View>
        </View>

        {/* ZATCA compliance header */}
        <View style={{
          backgroundColor: colors.primaryLight,
          padding: 10,
          borderRadius: 4,
          marginBottom: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{ fontSize: 7, fontWeight: 700, color: colors.textMuted }}>
              ISSUE DATE / تاريخ الإصدار
            </Text>
            <Text style={{ fontSize: 9, color: colors.text, marginTop: 2 }}>
              {formatPdfDate(data.issue_date)}
            </Text>
          </View>
          {data.period_start && (
            <View>
              <Text style={{ fontSize: 7, fontWeight: 700, color: colors.textMuted }}>
                PERIOD START / بداية الفترة
              </Text>
              <Text style={{ fontSize: 9, color: colors.text, marginTop: 2 }}>
                {formatPdfDate(data.period_start)}
              </Text>
            </View>
          )}
          {data.period_end && (
            <View>
              <Text style={{ fontSize: 7, fontWeight: 700, color: colors.textMuted }}>
                PERIOD END / نهاية الفترة
              </Text>
              <Text style={{ fontSize: 9, color: colors.text, marginTop: 2 }}>
                {formatPdfDate(data.period_end)}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ fontSize: 7, fontWeight: 700, color: colors.textMuted }}>
              STATUS / الحالة
            </Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: colors.success, marginTop: 2 }}>
              PAID / مدفوع
            </Text>
          </View>
        </View>

        {/* Parties: Issuer / Subscriber */}
        <View style={styles.infoGrid}>
          {/* Issuer (Platform) */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ISSUER / المُصدر</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: colors.text }}>
              {data.platform_name}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
              VAT #: {data.platform_vat_number}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>
              CR #: {data.platform_cr_number}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>
              {data.platform_address}
            </Text>
          </View>
          {/* Subscriber */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>BILL TO / فاتورة إلى</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: colors.text }}>
              {data.subscriber_name || '—'}
            </Text>
            {data.subscriber_vat_number && (
              <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
                VAT #: {data.subscriber_vat_number}
              </Text>
            )}
            {data.subscriber_cr_number && (
              <Text style={{ fontSize: 8, color: colors.textMuted }}>
                CR #: {data.subscriber_cr_number}
              </Text>
            )}
            {data.subscriber_address && (
              <Text style={{ fontSize: 8, color: colors.textMuted }}>
                {data.subscriber_address}
              </Text>
            )}
          </View>
        </View>

        {/* Subscription Details Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Details / تفاصيل الاشتراك</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Description / الوصف</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Duration / المدة</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Amount / المبلغ</Text>
            </View>

            {/* Tier row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '50%' }]}>
                {TIER_LABELS[data.tier] || data.tier} Plan
              </Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>
                {data.duration_months} {data.duration_months === 1 ? 'month / شهر' : 'months / أشهر'}
              </Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>
                {formatPdfSAR(data.subtotal)}
              </Text>
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal / المبلغ قبل الضريبة</Text>
              <Text style={styles.totalsValue}>{formatPdfSAR(data.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT 15% / ضريبة القيمة المضافة ١٥٪</Text>
              <Text style={styles.totalsValue}>{formatPdfSAR(data.vat_amount)}</Text>
            </View>
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>Total Paid / الإجمالي المدفوع</Text>
              <Text style={styles.totalsFinalValue}>{formatPdfSAR(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {data.paid_at && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information / معلومات الدفع</Text>
            <Text style={styles.paragraph}>
              Paid on: {formatPdfDate(data.paid_at)} | تم الدفع بتاريخ: {formatPdfDate(data.paid_at)}
            </Text>
            {data.payment_method && (
              <Text style={styles.paragraph}>
                Method: {data.payment_method === 'card' ? 'Credit/Debit Card' : 'Bank Transfer'} | الطريقة: {data.payment_method === 'card' ? 'بطاقة بنكية' : 'تحويل بنكي'}
              </Text>
            )}
          </View>
        )}

        {/* Bank Details for bank transfer */}
        {data.payment_method === 'bank_transfer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details / تفاصيل الحساب البنكي</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Bank / البنك</Text>
              <Text style={{ fontSize: 9, color: colors.text }}>
                {process.env.NEXT_PUBLIC_BANK_NAME || 'مصرف الراجحي - Al Rajhi Bank'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Account / الحساب</Text>
              <Text style={{ fontSize: 9, color: colors.text }}>
                {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'شركة رمال الماس العالمية'}
                {' / '}
                {process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME_EN || 'Rimal Al Mas International Company'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>IBAN / آيبان</Text>
              <Text style={{ fontSize: 9, color: colors.text, fontWeight: 700 }}>
                {process.env.NEXT_PUBLIC_BANK_IBAN || 'SA3580000126608016356809'}
              </Text>
            </View>
          </View>
        )}

        {/* ZATCA Notice */}
        <View style={{
          marginTop: 20,
          padding: 10,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 4,
          backgroundColor: colors.muted,
        }}>
          <Text style={{ fontSize: 7, color: colors.textMuted, lineHeight: 1.4 }}>
            This is a tax invoice issued in accordance with the Value Added Tax (VAT) regulations
            of the Kingdom of Saudi Arabia as mandated by the Zakat, Tax and Customs Authority (ZATCA).
            VAT Registration Number: {data.platform_vat_number}
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, lineHeight: 1.4, marginTop: 4, textAlign: 'right', direction: 'rtl' }}>
            هذه فاتورة ضريبية صادرة وفقاً لأنظمة ضريبة القيمة المضافة في المملكة العربية السعودية
            وفقاً لما تقتضيه هيئة الزكاة والضريبة والجمارك. رقم التسجيل الضريبي: {data.platform_vat_number}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Muhandes HUB — B2B Construction Marketplace — منصة مقاول هب
          </Text>
          <Text style={styles.footerText}>
            VAT: {data.platform_vat_number}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
