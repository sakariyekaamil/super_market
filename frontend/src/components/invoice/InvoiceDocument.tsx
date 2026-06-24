import { forwardRef } from 'react';
import { invoiceBrand, invoiceSize, PAYMENT_LABELS, PAYMENT_METHODS } from './invoiceTheme';
import type { InvoiceData } from './invoiceTypes';

interface InvoiceDocumentProps {
  data: InvoiceData;
}

const InvoiceDocument = forwardRef<HTMLDivElement, InvoiceDocumentProps>(({ data }, ref) => {
  const { dark, deep, primary, light, sidebar, warning } = invoiceBrand;
  const subTotal = data.total;
  const discount = data.payment?.discount ?? 0;
  const grandTotal = subTotal - discount;
  const invoiceDate = new Date(data.date).toLocaleDateString('en-GB');
  const title = data.documentType === 'PAYMENT' ? 'PAYMENT' : 'INVOICE';
  const isPaid = Boolean(data.payment);

  return (
    <div
      ref={ref}
      className="mx-auto bg-white shadow-md"
      style={{
        width: invoiceSize.width,
        minHeight: invoiceSize.minHeight,
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '11px',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${primary}, ${deep})` }}
          >
            A
          </div>
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-widest" style={{ color: primary }}>
              Alraxma
            </p>
            <p className="text-xs font-bold leading-tight" style={{ color: dark }}>
              {data.storeName}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <div
            className="rounded-bl-2xl px-5 py-2 text-sm font-bold tracking-wide text-white"
            style={{ backgroundColor: dark }}
          >
            {title}:
          </div>
          <div className="flex items-end gap-0.5 px-1.5 pb-0.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: light }} />
            <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: primary }} />
            <div className="h-3 w-3 rounded-full border" style={{ borderColor: deep }} />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 flex justify-between px-5">
        <div>
          <p className="text-[9px] font-bold tracking-wider" style={{ color: primary }}>
            {data.documentType === 'PAYMENT' ? 'PAID BY:' : 'INVOICE TO:'}
          </p>
          <p className="mt-0.5 text-sm font-bold leading-tight" style={{ color: dark }}>
            {data.customer}
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: invoiceBrand.muted }}>
            Cashier: {data.cashier}
          </p>
        </div>
        <div className="text-right text-[10px]" style={{ color: invoiceBrand.muted }}>
          <p>
            <span className="font-semibold" style={{ color: dark }}>
              {data.documentType === 'PAYMENT' ? 'Payment No:' : 'Invoice No:'}
            </span>{' '}
            {data.documentNo}
          </p>
          <p className="mt-0.5">
            <span className="font-semibold" style={{ color: dark }}>Sale No:</span>{' '}
            {String(data.saleId).padStart(5, '0')}
          </p>
          <p className="mt-0.5">
            <span className="font-semibold" style={{ color: dark }}>Date:</span> {invoiceDate}
          </p>
          <p className="mt-0.5">
            <span className="font-semibold" style={{ color: dark }}>Status:</span>{' '}
            <span style={{ color: isPaid ? primary : warning }}>{isPaid ? 'Paid' : 'Pending'}</span>
          </p>
        </div>
      </div>

      <div className="mx-5 mt-4 border-t" style={{ borderColor: primary }} />

      {/* Body */}
      <div className="mt-3 flex gap-3 px-5 pb-4">
        <div className="w-28 shrink-0 rounded-tr-2xl p-2.5" style={{ backgroundColor: sidebar }}>
          <p className="text-[8px] font-bold tracking-wider" style={{ color: deep }}>
            PAYMENT METHOD
          </p>
          <ul className="mt-1.5 space-y-1 text-[9px]" style={{ color: invoiceBrand.muted }}>
            {PAYMENT_METHODS.map((m) => (
              <li key={m} className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full" style={{ backgroundColor: primary }} />
                {m}
                {data.payment && PAYMENT_LABELS[data.payment.method] === m && (
                  <span className="font-bold" style={{ color: primary }}>✓</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[8px] font-bold tracking-wider" style={{ color: deep }}>
            TERMS
          </p>
          <p className="mt-1 text-[7px] leading-snug" style={{ color: invoiceBrand.muted }}>
            Goods not returnable after 7 days. Keep this document for your records.
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b text-left text-[8px] font-bold uppercase tracking-wider" style={{ borderColor: dark, color: dark }}>
                <th className="pb-1.5 pr-1">Product</th>
                <th className="pb-1.5 pr-1 text-right">Price</th>
                <th className="pb-1.5 pr-1 text-center">Qty</th>
                <th className="pb-1.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b" style={{ borderColor: sidebar }}>
                  <td className="py-1.5 pr-1 leading-tight" style={{ color: dark }}>{item.name}</td>
                  <td className="py-1.5 pr-1 text-right" style={{ color: invoiceBrand.muted }}>
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-1.5 pr-1 text-center" style={{ color: invoiceBrand.muted }}>{item.quantity}</td>
                  <td className="py-1.5 text-right font-medium" style={{ color: dark }}>
                    ${item.subTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex justify-end">
            <div className="w-40 space-y-1 text-[10px]">
              <div className="flex justify-between" style={{ color: invoiceBrand.muted }}>
                <span>SUB TOTAL</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between" style={{ color: invoiceBrand.muted }}>
                  <span>DISCOUNT</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div
                className="flex justify-between border-t pt-1 text-xs font-bold"
                style={{ borderColor: dark, color: dark }}
              >
                <span>TOTAL</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
              {data.payment && (
                <>
                  <div className="flex justify-between" style={{ color: invoiceBrand.muted }}>
                    <span>PAID ({PAYMENT_LABELS[data.payment.method] || data.payment.method})</span>
                    <span>${data.payment.paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold" style={{ color: primary }}>
                    <span>CHANGE</span>
                    <span>${data.payment.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="flex justify-end px-5 pb-3">
        <div className="text-center">
          <p className="text-[10px] font-semibold italic" style={{ color: deep, fontFamily: 'cursive' }}>
            {data.cashier}
          </p>
          <div className="my-1 border-b" style={{ width: 120, borderColor: deep }} />
          <p className="text-[8px]" style={{ color: invoiceBrand.muted }}>Authorized Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-5 py-2.5 text-[8px] text-white"
        style={{ backgroundColor: dark }}
      >
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: light }} />
          <div className="h-1.5 w-4 rounded" style={{ backgroundColor: primary }} />
        </div>
        <p className="text-center leading-tight">
          +252 61 000 0000 | info@alraxma.com
        </p>
        <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: primary }}>
          <div className="h-1.5 w-1.5 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
});

InvoiceDocument.displayName = 'InvoiceDocument';
export default InvoiceDocument;
