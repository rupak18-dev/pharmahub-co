import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Trash2, Check, ArrowLeft, Building2 } from 'lucide-react';
import { INITIAL_SUPPLIERS } from '../../constants/purchaseData';
import { INITIAL_MEDICINES } from '../../constants/inventoryData';
import { PurchaseSummary } from '../../components/purchases/PurchaseSummary';

export default function NewPurchase() {
  const navigate = useNavigate();

  // Form Headers
  const [selectedSupplier, setSelectedSupplier] = useState(INITIAL_SUPPLIERS[0].name);
  const [invoiceNo, setInvoiceNo] = useState('INV-SUN-8841');
  const [invoiceDate, setInvoiceDate] = useState('2026-07-30');
  const [purchaseDate, setPurchaseDate] = useState('2026-07-30');
  const [warehouse, setWarehouse] = useState('Main Central Warehouse');

  // Purchase Items Table
  const [items, setItems] = useState([
    {
      id: 1,
      medicineName: 'Amoxicillin 500mg',
      batchNumber: 'AMX-2026-99',
      mfdDate: '2024-11-01',
      expiryDate: '2026-11-15',
      purchasePrice: 65.0,
      mrp: 125.0,
      sellingPrice: 95.0,
      gstRate: 12,
      discount: 5,
      quantity: 100,
      freeQuantity: 10,
    },
  ]);

  const [transportCharges, setTransportCharges] = useState(250);
  const [otherCharges, setOtherCharges] = useState(0);

  const handleAddItem = () => {
    const newRow = {
      id: Date.now(),
      medicineName: 'Dolo 650mg Tablet',
      batchNumber: `DOL-${Math.floor(1000 + Math.random() * 9000)}`,
      mfdDate: '2024-08-01',
      expiryDate: '2026-08-20',
      purchasePrice: 20.0,
      mrp: 34.5,
      sellingPrice: 30.0,
      gstRate: 12,
      discount: 5,
      quantity: 200,
      freeQuantity: 0,
    };
    setItems((prev) => [...prev, newRow]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Computations
  const subtotal = items.reduce((acc, i) => acc + i.purchasePrice * i.quantity, 0);
  const discount = items.reduce((acc, i) => acc + (i.purchasePrice * i.quantity * (i.discount || 0)) / 100, 0);
  const taxable = subtotal - discount;
  const gst = items.reduce((acc, i) => {
    const lineTaxable = (i.purchasePrice * i.quantity) * (1 - (i.discount || 0) / 100);
    return acc + (lineTaxable * (i.gstRate || 12)) / 100;
  }, 0);

  const handleCompletePurchase = () => {
    if (items.length === 0) return;
    alert(`Purchase Invoice ${invoiceNo} recorded successfully! Stock and supplier ledger updated.`);
    navigate('/dashboard/purchases/history');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/purchases/orders')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchase Orders</span>
        </button>
      </div>

      {/* Header Fields Section */}
      <div className="saas-card rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Inward Purchase Invoice & Vendor Header</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-500 mb-1">Select Supplier *</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white font-medium"
            >
              {INITIAL_SUPPLIERS.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Vendor Invoice # *</label>
            <input
              type="text"
              required
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Inward Entry Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-500 mb-1">Warehouse Location</label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white"
            >
              <option value="Main Central Warehouse">Main Central Warehouse</option>
              <option value="Storage Facility B">Storage Facility B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medicine Entry Table & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="saas-card rounded-2xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Inward Medicines Line Items
              </h4>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-md shadow-blue-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-2 font-sans">Medicine</th>
                    <th className="py-2.5 px-2">Batch</th>
                    <th className="py-2.5 px-2">Expiry</th>
                    <th className="py-2.5 px-2 text-right">Cost (₹)</th>
                    <th className="py-2.5 px-2 text-right">MRP (₹)</th>
                    <th className="py-2.5 px-2 text-right">Sell (₹)</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-center">Free</th>
                    <th className="py-2.5 px-2 text-right font-sans">Line Total</th>
                    <th className="py-2.5 px-2 text-center font-sans">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {items.map((it) => {
                    const lineTotal = it.purchasePrice * it.quantity * (1 - (it.discount || 0) / 100);
                    return (
                      <tr key={it.id}>
                        <td className="py-2 px-2 font-sans font-bold text-slate-900 dark:text-white">{it.medicineName}</td>
                        <td className="py-2 px-2 text-blue-600 font-bold">{it.batchNumber}</td>
                        <td className="py-2 px-2 text-slate-500">{it.expiryDate}</td>
                        <td className="py-2 px-2 text-right">₹{it.purchasePrice.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right">₹{it.mrp.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right">₹{it.sellingPrice.toFixed(2)}</td>
                        <td className="py-2 px-2 text-center font-bold text-slate-900 dark:text-white">{it.quantity}</td>
                        <td className="py-2 px-2 text-center text-emerald-500 font-bold">+{it.freeQuantity}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-white">₹{lineTotal.toFixed(2)}</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Summary & Action Column (1 Col) */}
        <div className="space-y-4">
          <PurchaseSummary
            subtotal={subtotal}
            discount={discount}
            gst={gst}
            transportCharges={transportCharges}
            otherCharges={otherCharges}
            setTransportCharges={setTransportCharges}
            setOtherCharges={setOtherCharges}
          />

          <div className="space-y-2">
            <button
              onClick={handleCompletePurchase}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Complete Inward Purchase</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/purchases/orders')}
              className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
            >
              Cancel Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
