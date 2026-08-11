import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { DashboardStats, Challan, StockLog } from '../types';
import { Users, Package, AlertTriangle, FileCheck, IndianRupee, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [recentStockLogs, setRecentStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/stats/dashboard');
      if (data.success) {
        setStats(data.stats);
        setLowStockProducts(data.lowStockProducts || []);
        setRecentChallans(data.recentChallans || []);
        setRecentStockLogs(data.recentStockLogs || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-400" />
        <p>Loading Dashboard Metrics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white">Operations Overview</h3>
          <p className="text-xs text-slate-400">Real-time status of distribution, stock inventory & customer leads.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('create-challan')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Challan</span>
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Manage Customers</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>Check Inventory</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Customers</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">{stats?.totalCustomers}</div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">{stats?.activeCustomers} Active</span>
            <span>•</span>
            <span className="text-purple-400 font-semibold">{stats?.leadCustomers} Leads</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">{stats?.lowStockCount}</div>
          <div className="text-xs text-amber-400 font-medium">
            {stats?.lowStockCount ? 'Action required: Reorder items' : 'All stock levels healthy'}
          </div>
        </div>

        {/* Total Sales Revenue */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Confirmed Sales</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">
            ₹{stats?.totalRevenue?.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400">
            From <span className="text-emerald-400 font-semibold">{stats?.confirmedChallansCount}</span> confirmed challans
          </div>
        </div>

        {/* Sales Challans */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Draft Challans</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">{stats?.draftChallansCount}</div>
          <div className="text-xs text-slate-400">Pending confirmation & dispatch</div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">Attention: Low Stock Threshold Reached</h4>
              <p className="text-xs text-amber-300/80">
                {lowStockProducts.length} product(s) are below minimum alert quantity. Check inventory tab to update stock.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
          >
            View Low Stock Items
          </button>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Challans */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Recent Sales Challans</h3>
            <button
              onClick={() => setActiveTab('challans')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentChallans.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-sky-400">{ch.challanNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase badge-${ch.status.toLowerCase()}`}>
                      {ch.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-1">{ch.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs text-white">₹{ch.totalAmount.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-400">{ch.totalQuantity} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Movement Log Trail */}
        <div className="glass-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Recent Inventory Logs</h3>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentStockLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{log.productName}</div>
                  <div className="text-[10px] text-slate-400">{log.reason} • by {log.createdBy}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    log.movementType === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {log.movementType === 'IN' ? '+' : '-'}{log.quantityChanged} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
