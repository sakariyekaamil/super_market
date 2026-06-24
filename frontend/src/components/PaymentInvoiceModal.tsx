import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { salesApi } from '../api';
import InvoiceDocument from './invoice/InvoiceDocument';
import InvoiceModalShell from './invoice/InvoiceModalShell';
import type { InvoiceData } from './invoice/invoiceTypes';

export interface PaymentInvoiceTarget {
  paymentId: number;
  saleId: number;
  paymentDate: string;
}

interface PaymentInvoiceModalProps {
  target: PaymentInvoiceTarget | null;
  onClose: () => void;
}

export default function PaymentInvoiceModal({ target, onClose }: PaymentInvoiceModalProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) {
      setInvoice(null);
      return;
    }
    setLoading(true);
    salesApi
      .getReceipt(target.saleId)
      .then((res) => {
        const r = res.data.data.receipt;
        setInvoice({
          storeName: r.storeName,
          documentType: 'PAYMENT',
          documentNo: String(target.paymentId).padStart(5, '0'),
          saleId: r.saleId,
          paymentId: target.paymentId,
          date: target.paymentDate,
          cashier: r.cashier,
          customer: r.customer,
          items: r.items,
          total: r.total,
          payment: r.payment,
        });
      })
      .catch(() => {
        toast.error('Failed to load payment invoice');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [target, onClose]);

  if (!target) return null;

  return (
    <InvoiceModalShell
      title="Payment Invoice"
      filename={`payment-${target.paymentId}.pdf`}
      loading={loading}
      ready={!!invoice}
      onClose={onClose}
    >
      {invoice && <InvoiceDocument data={invoice} />}
    </InvoiceModalShell>
  );
}
