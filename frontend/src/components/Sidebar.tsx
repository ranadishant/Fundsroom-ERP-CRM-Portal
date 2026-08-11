import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  PlusCircle,
  LogOut,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { id: 'customers', label: 'Customer CRM', icon: Users, roles: ['Admin', 'Sales', 'Accounts'] },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package, roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { id: 'challans', label: 'Sales Challans', icon: FileText, roles: ['Admin', 'Sales', 'Warehouse', 'Accounts'] },
    { id: 'create-challan', label: 'New Sales Challan', icon: PlusCircle, roles: ['Admin', 'Sales'] },
  ];

  const allowedNavs = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight">Fundsroom</h1>
          <p className="text-xs text-sky-400 font-medium">ERP + CRM Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Main Navigation
        </div>
        {allowedNavs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-sky-400 border border-sky-500/30 shadow-md shadow-sky-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">{user?.name}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 border border-slate-700">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
