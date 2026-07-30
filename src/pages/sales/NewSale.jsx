import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  PauseCircle,
  FileText,
  Printer,
  Share2,
  XCircle,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { ProductSearch } from '../../components/sales/ProductSearch';
import { BarcodeInput } from '../../components/sales/BarcodeInput';
import { BillingTable } from '../../components/sales/BillingTable';
import { CustomerCard } from '../../components/sales/CustomerCard';
import { PaymentCard } from '../../components/sales/PaymentCard';
import { InvoiceSummary } from '../../components/sales/InvoiceSummary';
import { SaleToolbar } from '../../components/sales/SaleToolbar';

export default function NewSale() {
  const navigate = useNavigate();

  // Cart & Customer States
  const [cart, setCart] = useState([
    {
      id: 'MED-1002',
      name: 'Dolo 650mg Tablet',
      genericName: 'Paracetamol IP 650mg',
      batchNumber: 'DOL-9901',
      qty: 2,
      sellingPrice: 30.0,
      discount: 5,
      gstRate: 12,
      currentStock: 850,
    },
  ]);

  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [doctorName, setDoctorName] = useState('Self / OTC');
  const [prescriptionNo, setPrescriptionNo] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI / QR');
  const [paidAmount, setPaidAmount] = useState(200);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  // Cart Handlers
  const handleSelectMedicine = (med) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === med.id);
      if (existing) {
        return prev.map((item) =>
          item.id === med.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: med.id,
          name: med.name,
          genericName: med.genericName,
          batchNumber: med.batchNumber,
          qty: 1,
          sellingPrice: med.sellingPrice,
          discount: 0,
          gstRate: med.gstRate || 12,
          currentStock: med.currentStock,
        },
      ];
    });
  };

  const handleUpdateQty = (id, newQty) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
    );
  };

  const handleUpdateDiscount = (id, newDiscount) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, discount: newDiscount } : item))
    );
  };

  const handleRemoveItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Computations
  const subtotal = cart.reduce((acc, item) => acc + item.sellingPrice * item.qty, 0);
  const discountAmount = cart.reduce(
    (acc, item) => acc + (item.sellingPrice * item.qty * (item.discount || 0)) / 100,
    0
  );
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = taxableAmount * 0.12;
  const rawTotal = taxableAmount + gstAmount;
  const grandTotal = Math.round(rawTotal);
  const roundOff = grandTotal - rawTotal;

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const invoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString(),
      customerName: customerName || 'Walk-in Customer',
      doctorName: doctorName || 'Self / OTC',
      prescriptionNo: prescriptionNo || 'N/A',
      paymentMode,
      items: cart,
      subtotal,
      discountAmount,
      gstAmount,
      roundOff,
      grandTotal,
      paidAmount,
    };

    setLastInvoice(invoice);
    setIsReceiptModalOpen(true);
    setCart([]);
  };

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    alert(`Bill held successfully for ${customerName}. Reference: HOLD-${Math.floor(100 + Math.random() * 900)}`);
    setCart([]);
  };

  const handleDraftBill = () => {
    if (cart.length === 0) return;
    alert(`Draft saved for ${customerName}. Reference: DRAFT-${Math.floor(500 + Math.random() * 900)}`);
    setCart([]);
  };

  return (
    <div className="space-y-4">
      {/* Back & Title Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/billing')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Billing Hub</span>
        </button>

        <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          POS Terminal #01 Active
        </span>
      </div>

      {/* Main Billing Grid: Left (Product & Table) | Right (Customer & Invoice Sticky) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Search, Barcode, Table, Keyboard Toolbar */}
        <div className="lg:col-span-2 space-y-4">
          <ProductSearch onSelectMedicine={handleSelectMedicine} />
          <BarcodeInput onBarcodeMatch={handleSelectMedicine} />
          <BillingTable
            items={cart}
            onUpdateQty={handleUpdateQty}
            onUpdateDiscount={handleUpdateDiscount}
            onRemoveItem={handleRemoveItem}
          />
          <SaleToolbar />
        </div>

        {/* Right Column (1 Col): Customer, Payment, Invoice Summary & Actions */}
        <div className="space-y-4">
          <CustomerCard
            customerName={customerName}
            setCustomerName={setCustomerName}
            doctorName={doctorName}
            setDoctorName={setDoctorName}
            prescriptionNo={prescriptionNo}
            setPrescriptionNo={setPrescriptionNo}
          />

          <PaymentCard selectedMode={paymentMode} onSelectMode={setPaymentMode} />

          <InvoiceSummary
            subtotal={subtotal}
            discountAmount={discountAmount}
            gstAmount={gstAmount}
            roundOff={roundOff}
            grandTotal={grandTotal}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
          />

          {/* Action Buttons Stack */}
          <div className="space-y-2">
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Sale & Print Invoice (Enter)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleHoldBill}
                disabled={cart.length === 0}
                className="py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4" />
                <span>Hold Bill (F8)</span>
              </button>

              <button
                onClick={handleDraftBill}
                disabled={cart.length === 0}
                className="py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
            </div>

            <div className="flex justify-between gap-2 pt-1 text-xs">
              <button
                onClick={() => setCart([])}
                className="text-rose-500 hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Sale (Esc)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {isReceiptModalOpen && lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="saas-card max-w-md w-full rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Pharma<span className="text-blue-600">Hub</span> Central Pharmacy
              </h3>
              <p className="text-[11px] text-slate-400">GSTIN: 27AABCU9603R • Regd License # 20B/21B</p>
            </div>

            <div className="font-mono text-xs space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span>Invoice #: <strong className="text-blue-600">{lastInvoice.id}</strong></span>
                <span>{lastInvoice.date}</span>
              </div>
              <div className="border-b pb-2">
                <p>Patient: <strong>{lastInvoice.customerName}</strong></p>
                <p>Doctor: {lastInvoice.doctorName}</p>
                <p>Payment: {lastInvoice.paymentMode}</p>
              </div>

              <div className="space-y-1 py-1">
                {lastInvoice.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.name} x{it.qty}</span>
                    <span>₹{(it.sellingPrice * it.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t font-bold text-sm flex justify-between text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-blue-600">₹{lastInvoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
