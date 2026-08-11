import React from 'react';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, switchRoleQuick } = useAuth();

  const roles: UserRole[] = ['Admin', 'Sales', 'Warehouse', 'Accounts'];

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-white capitalize">{title}</h2>
      </div>

      {/* Quick Role Switcher Bar for Screen Recording & Viva Demo */}
      <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Demo Quick Switch:</span>
        </div>
        <div className="flex gap-1">
          {roles.map((r) => {
            const isCurrent = user?.role === r;
            return (
              <button
                key={r}
                onClick={() => switchRoleQuick(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  isCurrent
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
