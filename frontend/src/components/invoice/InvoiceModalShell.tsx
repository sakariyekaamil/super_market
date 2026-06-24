import { useRef, useState, ReactNode } from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import { invoiceBrand, invoiceSize } from './invoiceTheme';

interface InvoiceModalShellProps {
  title: string;
  filename: string;
  loading: boolean;
  ready: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function InvoiceModalShell({
  title,
  filename,
  loading,
  ready,
  onClose,
  children,
}: InvoiceModalShellProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!invoiceRef.current || !ready) return;
    setDownloading(true);
    try {
      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: invoiceSize.pdfFormat, orientation: 'portrait' },
        })
        .from(invoiceRef.current)
        .save();
      toast.success('Downloaded successfully');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Allow pop-ups to print.');
      return;
    }
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${invoiceRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ui-card px-4 py-3">
          <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={loading || downloading || !ready}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
            <button onClick={handlePrint} disabled={loading || !ready} className="btn-secondary flex items-center gap-2 text-sm">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="rounded p-1 hover:bg-ui-card">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex justify-center overflow-y-auto p-4" style={{ backgroundColor: invoiceBrand.bg }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand-primary" />
            </div>
          ) : (
            <div ref={invoiceRef}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
