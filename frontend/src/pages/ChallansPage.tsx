import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Challan } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Printer, CheckCircle, XCircle, Eye, FileText, X, AlertTriangle } from 'lucide-react';

interface ChallansPageProps {
  onNewChallan: () => void;
}

export const ChallansPage: React.FC<ChallansPageProps> = ({ onNewChallan }) => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Challan Detail Modal
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  // Error Alert Modal for Insufficient Stock
  const [stockError, setStockError] = useState<string | null>(null);

  const loadChallans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const data = await apiFetch(`/challans?${params.toString()}`);
      if (data.success) {
        setChallans(data.challans);
      }
    } catch (err) {
      console.error('Failed to load challans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallans();
  }, [search, statusFilter]);

  const handleStatusChange = async (challanId: string, newStatus: 'Confirmed' | 'Cancelled') => {
    setStockError(null);
    try {
      await apiFetch(`/challans/${challanId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ newStatus })
      });
      if (selectedChallan && selectedChallan.id === challanId) {
        setSelectedChallan(null);
      }
      loadChallans();
    } catch (err: any) {
      setStockError(err.message || 'Failed to update challan status');
    }
  };

  const openInvoicePrint = (challanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/challans/${challanId}/invoice-html`, '_blank');
  };

  const canCreate = user?.role === 'Admin' || user?.role === 'Sales';

  return (
    <div className="p-6 space-y-6">
      {/* Search & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Challan No or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl glass-input text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Draft">Draft</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {canCreate && (
          <button
            onClick={onNewChallan}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Challan</span>
          </button>
        )}
      </div>

      {/* Stock Error Alert Banner */}
      {stockError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{stockError}</span>
          </div>
          <button onClick={() => setStockError(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Challan List Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
                <th className="py-3.5 px-4">Challan No & Date</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4 text-center">Items Qty</th>
                <th className="py-3.5 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4 text-right">Invoice & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading Sales Challans...</td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No Sales Challans found.</td>
                </tr>
              ) : (
                challans.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedChallan(c)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-400 text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{c.challanNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      {c.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                      {c.totalQuantity} items
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-white text-sm">
                      ₹{c.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {c.createdBy}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={(e) => openInvoicePrint(c.id, e)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold text-[11px] border border-sky-500/30 transition inline-flex items-center gap-1"
                        title="Print PDF Invoice"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Invoice PDF</span>
                      </button>

                      {c.status === 'Draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(c.id, 'Confirmed');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[11px] border border-emerald-500/30 transition inline-flex items-center gap-1"
                          title="Confirm Challan & Deduct Stock"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Confirm</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Challan Detail View Modal */}
      {selectedChallan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedChallan.challanNumber}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase badge-${selectedChallan.status.toLowerCase()}`}>
                    {selectedChallan.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Customer: <strong className="text-white">{selectedChallan.customerName}</strong></p>
              </div>
              <button onClick={() => setSelectedChallan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Items Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase">Snapshot Items Breakdown</h4>
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedChallan.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-mono text-sky-400">{item.sku}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{item.name}</td>
                        <td className="py-2.5 px-3 text-right text-slate-300">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white">₹{item.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Footer */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Total Challan Amount:</span>
              <span className="text-lg font-extrabold text-emerald-400">₹{selectedChallan.totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                onClick={(e) => openInvoicePrint(selectedChallan.id, e)}
                className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-400 transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Open Printable PDF Invoice</span>
              </button>

              <div className="flex gap-2">
                {selectedChallan.status === 'Draft' && (
                  <button
                    onClick={() => handleStatusChange(selectedChallan.id, 'Confirmed')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                  >
                    Confirm Challan
                  </button>
                )}
                {selectedChallan.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleStatusChange(selectedChallan.id, 'Cancelled')}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/30 hover:bg-rose-500/30 transition"
                  >
                    Cancel Challan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
