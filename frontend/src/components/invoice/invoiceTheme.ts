/** Alraxma application brand palette */
export const invoiceBrand = {
  dark: '#152D2F',
  deep: '#33544E',
  primary: '#4CAF6A',
  light: '#8BE28A',
  warning: '#F08A4B',
  sidebar: '#D8E1DB',
  bg: '#F7FCFA',
  text: '#152D2F',
  muted: '#5a6b66',
} as const;

export const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash',
  ZAAD: 'Zaad',
  EDAHAB: 'Edahab',
  CARD: 'Card',
};

export const PAYMENT_METHODS = ['Cash', 'Zaad', 'Edahab', 'Card'] as const;

/** Compact invoice dimensions (A5-ish) */
export const invoiceSize = {
  width: '148mm',
  minHeight: 'auto',
  pdfFormat: 'a5' as const,
} as const;
