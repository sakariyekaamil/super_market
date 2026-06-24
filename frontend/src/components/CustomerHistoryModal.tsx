import { X, ArrowLeft, CheckCircle2, Clock, FileText } from 'lucide-react';
import LoadingSkeleton from './ui/LoadingSkeleton';
import EmptyState from './ui/EmptyState';

interface SaleItem {
  product: { productName: string };
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

interface SaleHistory {
  saleId: number;
  saleDate: string;
  totalAmount: number;
  items: SaleItem[];
  payment?: { paymentMethod: string } | null;
}

interface CustomerHistoryModalProps {
  open: boolean;
  customerName: string;
  sales?: SaleHistory[];
  loading?: boolean;
  onClose: () => void;
  onViewInvoice?: (saleId: number) => void;
}

function formatOrderDate(date: string) {
  return new Date(date)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    .toUpperCase();
}

export default function CustomerHistoryModal({
  open,
  customerName,
  sales,
  loading,
  onClose,
  onViewInvoice,
}: CustomerHistoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-ui-bg shadow-2xl dark:bg-brand-dark">
        {/* Header */}
        <div className="flex items-center gap-3 bg-brand-deep px-4 py-4 text-white">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
            aria-label="Close"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 text-center pr-9">
            <p className="text-[10px] font-medium uppercase tracking-widest text-brand-light/80">Customer</p>
            <h3 className="text-sm font-semibold leading-tight">{customerName}</h3>
          </div>
        </div>
        <div className="bg-brand-primary px-4 py-2.5 text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Orders</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <LoadingSkeleton />
          ) : !sales?.length ? (
            <EmptyState title="No orders" message="This customer has no purchase history yet." />
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => {
                const isPaid = Boolean(sale.payment);
                return (
                  <div
                    key={sale.saleId}
                    className="overflow-hidden rounded-xl border border-ui-card/80 bg-white shadow-sm dark:border-brand-deep/50 dark:bg-brand-deep/30"
                  >
                    {/* Date strip */}
                    <div className="border-b border-ui-card/60 px-4 py-2 dark:border-brand-deep/40">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                        {formatOrderDate(sale.saleDate)}
                      </p>
                    </div>

                    <div className="px-4 pt-3">
                      {/* Order row */}
                      <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-brand-deep dark:text-brand-light">
                          Order #{sale.saleId}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-brand-dark/70 dark:text-ui-bg/70">
                          {isPaid ? (
                            <>
                              <CheckCircle2 size={14} className="text-brand-primary" />
                              <span>Paid</span>
                            </>
                          ) : (
                            <>
                              <Clock size={14} className="text-accent-warning" />
                              <span>Pending</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-3 space-y-0">
                        {sale.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between border-b border-ui-card/50 py-2.5 text-sm last:border-0 dark:border-brand-deep/30"
                          >
                            <span className="flex-1 truncate pr-2 text-brand-dark dark:text-ui-bg">
                              {item.product.productName}
                            </span>
                            <span className="w-14 text-center text-xs text-brand-deep/60 dark:text-ui-bg/50">
                              {item.quantity} pcs
                            </span>
                            <span className="w-16 text-right font-medium text-brand-dark dark:text-ui-bg">
                              ${Number(item.subTotal).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="mt-2 flex items-center justify-between border-t border-ui-card/60 py-3 dark:border-brand-deep/40">
                        {onViewInvoice ? (
                          <button
                            onClick={() => onViewInvoice(sale.saleId)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary transition-colors hover:text-brand-deep"
                          >
                            <FileText size={14} />
                            View Invoice
                          </button>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-brand-deep/60 dark:text-ui-bg/50">Total</span>
                          <span className="text-lg font-bold text-brand-dark dark:text-ui-bg">
                            $ {Number(sale.totalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom close */}
        <div className="border-t border-ui-card/60 bg-white px-4 py-3 dark:border-brand-deep/40 dark:bg-brand-deep/20">
          <button onClick={onClose} className="btn-secondary w-full flex items-center justify-center gap-2">
            <X size={16} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
