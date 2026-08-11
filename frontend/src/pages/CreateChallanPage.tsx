import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Customer, Product } from '../types';
import { Plus, Trash2, AlertCircle, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CreateChallanPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormItem {
  productId: string;
  quantity: number;
}

export const CreateChallanPage: React.FC<CreateChallanPageProps> = ({ onSuccess, onCancel }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Confirmed'>('Confirmed');
  const [items, setItems] = useState<FormItem[]>([
    { productId: '', quantity: 1 }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, prodRes] = await Promise.all([
        apiFetch('/customers'),
        apiFetch('/products')
      ]);

      if (custRes.success) setCustomers(custRes.customers);
      if (prodRes.success) {
        setProducts(prodRes.products);
        if (prodRes.products.length > 0) {
          setItems([{ productId: prodRes.products[0].id, quantity: 1 }]);
        }
      }
      if (custRes.customers.length > 0) {
        setSelectedCustomerId(custRes.customers[0].id);
      }
    } catch (err) {
      console.error('Failed to load customers/products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItemRow = () => {
    const firstProduct = products.length > 0 ? products[0].id : '';
    setItems([...items, { productId: firstProduct, quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [field]: value };
    setItems(copy);
  };

  // Calculations
  const calculatedItems = items.map(item => {
    const prod = products.find(p => p.id === item.productId);
    const unitPrice = prod ? prod.unitPrice : 0;
    const stock = prod ? prod.currentStock : 0;
    const total = unitPrice * (item.quantity || 0);
    const isExceedingStock = (item.quantity || 0) > stock;
    return {
      ...item,
      product: prod,
      unitPrice,
      stock,
      total,
      isExceedingStock
    };
  });

  const grandTotal = calculatedItems.reduce((acc, i) => acc + i.total, 0);
  const grandQty = calculatedItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const hasStockWarning = status === 'Confirmed' && calculatedItems.some(i => i.isExceedingStock);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.some(i => !i.productId || i.quantity <= 0)) {
      setError('All items must have a valid product and quantity > 0.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch('/challans', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: items.map(i => ({ productId: i.productId, quantity: Number(i.quantity) })),
          status
        })
      });

      if (data.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error creating sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Challan Generator...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Create New Sales Challan</h2>
            <p className="text-xs text-slate-400">Select customer, add products and generate auto-numbered challan.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hasStockWarning && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Warning: One or more selected item quantities exceed current warehouse stock. If confirmed, submission will fail validation.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Status Header Card */}
        <div className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Customer *</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-medium"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName || c.customerName} ({c.customerType}) - {c.mobile}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Challan Submission Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Confirmed')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  status === 'Confirmed'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Deduct Stock</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Draft')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  status === 'Draft'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Save as Draft</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Product Selector Rows */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Challan Items</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 font-semibold text-xs border border-sky-500/30 flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item Row</span>
            </button>
          </div>

          <div className="space-y-3">
            {calculatedItems.map((item, index) => (
              <div
                key={index}
                className={`p-3.5 rounded-xl bg-slate-900/80 border flex flex-col md:flex-row items-center gap-3 transition ${
                  item.isExceedingStock && status === 'Confirmed'
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : 'border-slate-800'
                }`}
              >
                {/* Product Dropdown */}
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Product Description</label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.name} (Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Price Display */}
                <div className="w-full md:w-32">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Unit Price</label>
                  <div className="px-3 py-2 rounded-xl bg-slate-950 text-slate-300 text-xs font-mono font-semibold border border-slate-800">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="w-full md:w-28">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold text-center"
                  />
                </div>

                {/* Subtotal */}
                <div className="w-full md:w-36 text-right">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Row Total</label>
                  <div className="font-extrabold text-white text-sm py-1.5">
                    ₹{item.total.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Delete Row Button */}
                <div className="self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length <= 1}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total Summary */}
          <div className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-slate-800 mt-4">
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Quantity: </span>
              <span className="font-bold text-white text-sm ml-1">{grandQty} items</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium mr-2">Grand Total:</span>
              <span className="text-xl font-extrabold text-emerald-400">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition"
          >
            {submitting ? 'Generating Challan...' : `Save & Issue Sales Challan (${status})`}
          </button>
        </div>
      </form>
    </div>
  );
};
