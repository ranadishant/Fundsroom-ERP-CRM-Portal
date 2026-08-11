import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@fundsroom.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      Admin: 'admin@fundsroom.com',
      Sales: 'sales@fundsroom.com',
      Warehouse: 'warehouse@fundsroom.com',
      Accounts: 'accounts@fundsroom.com',
    };
    setEmail(emailMap[role]);
    setPassword('Password123!');
    setLoading(true);
    setError(null);
    try {
      await login(emailMap[role], 'Password123!');
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fundsroom Infotech</h1>
          <p className="text-sm text-slate-400 mt-1">Mini ERP & CRM Operations Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              placeholder="user@fundsroom.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition duration-200"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Preset Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>1-Click Test Role Accounts (For Demo):</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('Admin')}
              className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700/60 transition"
            >
              <div className="text-xs font-bold text-sky-400">Admin</div>
              <div className="text-[10px] text-slate-400">Full System Control</div>
            </button>

            <button
              onClick={() => handleQuickLogin('Sales')}
              className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700/60 transition"
            >
              <div className="text-xs font-bold text-emerald-400">Sales</div>
              <div className="text-[10px] text-slate-400">CRM & Challans</div>
            </button>

            <button
              onClick={() => handleQuickLogin('Warehouse')}
              className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700/60 transition"
            >
              <div className="text-xs font-bold text-amber-400">Warehouse</div>
              <div className="text-[10px] text-slate-400">Stock & Inventory</div>
            </button>

            <button
              onClick={() => handleQuickLogin('Accounts')}
              className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700/60 transition"
            >
              <div className="text-xs font-bold text-purple-400">Accounts</div>
              <div className="text-[10px] text-slate-400">Billing & Verification</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
