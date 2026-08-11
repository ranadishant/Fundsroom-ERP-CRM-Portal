import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Product, StockLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit, History, X, Package } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'logs'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Add/Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unitPrice: '',
    currentStock: '',
    minStockAlert: '10',
    warehouseLocation: ''
  });

  // Stock Adjustment Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantityChanged: '',
    movementType: 'IN' as 'IN' | 'OUT',
    reason: ''
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (lowStockOnly) params.append('lowStock', 'true');
        const data = await apiFetch(`/products?${params.toString()}`);
        if (data.success) {
          setProducts(data.products);
        }
      } else {
        const data = await apiFetch('/products/stock-logs');
        if (data.success) {
          setStockLogs(data.stockLogs);
        }
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activeTab, search, lowStockOnly]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Electronics',
      unitPrice: '',
      currentStock: '',
      minStockAlert: '10',
      warehouseLocation: 'Wh-1 (Mumbai)'
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: String(p.unitPrice),
      currentStock: String(p.currentStock),
      minStockAlert: String(p.minStockAlert),
      warehouseLocation: p.warehouseLocation
    });
    setIsProductModalOpen(true);
  };

  const openStockModal = (p: Product) => {
    setSelectedProduct(p);
    setStockForm({
      quantityChanged: '',
      movementType: 'IN',
      reason: 'Purchase Inward Stock'
    });
    setIsStockModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        category: productForm.category,
        unitPrice: Number(productForm.unitPrice),
        currentStock: Number(productForm.currentStock),
        minStockAlert: Number(productForm.minStockAlert),
        warehouseLocation: productForm.warehouseLocation
      };

      if (editingProduct) {
        await apiFetch(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsProductModalOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await apiFetch(`/products/${selectedProduct.id}/stock`, {
        method: 'POST',
        body: JSON.stringify({
          quantityChanged: Number(stockForm.quantityChanged),
          movementType: stockForm.movementType,
          reason: stockForm.reason
        })
      });
      setIsStockModalOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock');
    }
  };

  const canManage = user?.role === 'Admin' || user?.role === 'Warehouse';

  return (
    <div className="p-6 space-y-6">
      {/* Tab Switcher & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'products'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Product Catalog & Stock
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
              activeTab === 'logs'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Audit Logs</span>
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search SKU or Product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-amber-400 cursor-pointer bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="rounded border-amber-500/50 text-amber-500 focus:ring-amber-500"
              />
              <span>Low Stock Alerts Only</span>
            </label>

            {canManage && (
              <button
                onClick={openAddProductModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Body */}
      {activeTab === 'products' ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
                  <th className="py-3.5 px-4">SKU / Product Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4">Warehouse Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Loading Inventory...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No products found.</td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLowStock = p.currentStock <= p.minStockAlert;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-sky-400 text-xs">{p.sku}</div>
                          <div className="font-bold text-white text-sm mt-0.5">{p.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                          ₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-3 py-1 rounded-full font-extrabold text-xs ${
                              isLowStock
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {p.currentStock} units
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1">Min alert: {p.minStockAlert}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {p.warehouseLocation}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {canManage && (
                            <>
                              <button
                                onClick={() => openStockModal(p)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[11px] border border-emerald-500/30 transition"
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Logs Audit Table */
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 text-center">Movement Type</th>
                  <th className="py-3.5 px-4 text-center">Quantity</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4">Log Creator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{log.productName}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        log.movementType === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.movementType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                      {log.quantityChanged}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{log.reason}</td>
                    <td className="py-3.5 px-4 text-sky-400 font-semibold">{log.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Product Specification' : 'Add New Inventory Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="e.g. Industrial Microcontroller Unit"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Part Code *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono uppercase"
                    placeholder="e.g. MCU-IND-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="e.g. Electronics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="1450"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Alert Min Qty *</label>
                  <input
                    type="number"
                    required
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse Location *</label>
                <input
                  type="text"
                  required
                  value={productForm.warehouseLocation}
                  onChange={(e) => setProductForm({ ...productForm, warehouseLocation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="e.g. Rack A-12, Wh-1 (Mumbai)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-400 transition"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Manual Stock Adjustment</h3>
                <p className="text-xs text-sky-400 font-medium">{selectedProduct.name} ({selectedProduct.sku})</p>
              </div>
              <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Current Stock Level:</span>
              <span className="font-extrabold text-white">{selectedProduct.currentStock} units</span>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Movement Type</label>
                  <select
                    value={stockForm.movementType}
                    onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value as 'IN' | 'OUT' })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold"
                  >
                    <option value="IN">IN (+) Stock Add</option>
                    <option value="OUT">OUT (-) Stock Remove</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockForm.quantityChanged}
                    onChange={(e) => setStockForm({ ...stockForm, quantityChanged: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="e.g. 25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Reference *</label>
                <input
                  type="text"
                  required
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="e.g. Inward Shipment PO-980 or Damaged Goods"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
