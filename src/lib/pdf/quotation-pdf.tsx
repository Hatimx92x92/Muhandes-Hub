// =============================================================================
// Muhandes HUB — Quotation PDF Template
// =============================================================================

import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, formatPdfSAR, formatPdfDate } from './styles';

interface LineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total?: number;
}

interface QuotationPdfData {
  number: string;
  status: string;
  client_name?: string;
  project_ref?: string;
  validity_days: number;
  line_items: LineItem[];
  subtotal: number;
  vat_amount: number;
  total: number;
  payment_terms_ar?: string;
  payment_terms_en?: string;
  delivery_terms_ar?: string;
  delivery_terms_en?: string;
  notes_ar?: string;
  notes_en?: string;
  created_at: string;
  sender_company?: string;
}

export function QuotationPdf({ data }: { data: QuotationPdfData }) {
  const lineItems = Array.isArray(data.line_items) ? data.line_items : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Muhandes HUB</Text>
            <Text style={styles.headerSubtitle}>منصة مقاول هب</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: '#0f766e' }}>
              QUOTATION / عرض سعر
            </Text>
            <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
              #{data.number}
            </Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
              {formatPdfDate(data.created_at)}
            </Text>
          </View>
        </View>

        {/* Info Grid: From / To */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>FROM / من</Text>
            <Text style={styles.infoValue}>
              {data.sender_company || 'Muhandes HUB User'}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>TO / إلى</Text>
            <Text style={styles.infoValue}>
              {data.client_name || '—'}
            </Text>
            {data.project_ref && (
              <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
                Ref: {data.project_ref}
              </Text>
            )}
          </View>
        </View>

        {/* Validity */}
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 8, color: '#6b7280' }}>
            Valid for {data.validity_days} days from issue date / صالح لمدة {data.validity_days} يوم من تاريخ الإصدار
          </Text>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items / البنود</Text>
          <View style={styles.table}>
            {/* Header Row */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { width: '37%' }]}>Description / الوصف</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, { width: '13%', textAlign: 'center' }]}>Unit</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Total</Text>
            </View>
            {/* Data Rows */}
            {lineItems.map((item, i) => {
              const lineTotal = item.total ?? item.quantity * item.unit_price;
              return (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{i + 1}</Text>
                  <Text style={[styles.tableCell, { width: '37%' }]}>{item.description}</Text>
                  <Text style={[styles.tableCell, { width: '12%', textAlign: 'center' }]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, { width: '13%', textAlign: 'center' }]}>{item.unit}</Text>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>
                    {formatPdfSAR(item.unit_price)}
                  </Text>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 700 }]}>
                    {formatPdfSAR(lineTotal)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal / المجموع الفرعي</Text>
              <Text style={styles.totalsValue}>{formatPdfSAR(data.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT 15% / ضريبة القيمة المضافة</Text>
              <Text style={styles.totalsValue}>{formatPdfSAR(data.vat_amount)}</Text>
            </View>
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>Total / الإجمالي</Text>
              <Text style={styles.totalsFinalValue}>{formatPdfSAR(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Terms & Notes */}
        {(data.payment_terms_ar || data.payment_terms_en) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms / شروط الدفع</Text>
            {data.payment_terms_ar && (
              <Text style={styles.bilingualAr}>{data.payment_terms_ar}</Text>
            )}
            {data.payment_terms_en && (
              <Text style={styles.bilingualEn}>{data.payment_terms_en}</Text>
            )}
          </View>
        )}

        {(data.delivery_terms_ar || data.delivery_terms_en) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Terms / شروط التسليم</Text>
            {data.delivery_terms_ar && (
              <Text style={styles.bilingualAr}>{data.delivery_terms_ar}</Text>
            )}
            {data.delivery_terms_en && (
              <Text style={styles.bilingualEn}>{data.delivery_terms_en}</Text>
            )}
          </View>
        )}

        {(data.notes_ar || data.notes_en) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes / ملاحظات</Text>
            {data.notes_ar && (
              <Text style={styles.bilingualAr}>{data.notes_ar}</Text>
            )}
            {data.notes_en && (
              <Text style={styles.bilingualEn}>{data.notes_en}</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Muhandes HUB — B2B Construction Marketplace — منصة مقاول هب
          </Text>
          <Text style={styles.footerText}>
            {formatPdfDate(data.created_at)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
