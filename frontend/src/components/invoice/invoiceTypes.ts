export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface InvoicePayment {
  method: string;
  paid: number;
  discount: number;
  change: number;
}

export interface InvoiceData {
  storeName: string;
  documentType: 'INVOICE' | 'PAYMENT';
  documentNo: string;
  saleId: number;
  paymentId?: number;
  date: string;
  cashier: string;
  customer: string;
  items: InvoiceItem[];
  total: number;
  payment: InvoicePayment | null;
}
