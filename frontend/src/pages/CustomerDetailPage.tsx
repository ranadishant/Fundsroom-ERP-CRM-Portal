import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Customer, CustomerNote } from '../types';
import { ArrowLeft, Building, Phone, Mail, MapPin, Calendar, Plus, MessageSquare, Clock } from 'lucide-react';

interface CustomerDetailPageProps {
  customerId: string;
  onBack: () => void;
}

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ customerId, onBack }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/customers/${customerId}`);
      if (data.success) {
        setCustomer(data.customer);
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Failed to load customer details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [customerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const data = await apiFetch(`/customers/${customerId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote })
      });
      if (data.success) {
        setNewNote('');
        loadDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Error adding note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !customer) {
    return (
      <div className="p-8 text-center text-slate-400">Loading Customer CRM History...</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customers List</span>
      </button>

      {/* Customer Info Card */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{customer.customerName}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase badge-${customer.status.toLowerCase()}`}>
                {customer.status}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                {customer.customerType}
              </span>
            </div>
            <div className="text-slate-400 flex items-center gap-2 text-sm mt-1">
              <Building className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-300">{customer.businessName}</span>
              {customer.gstNumber && <span className="text-xs font-mono text-slate-500">• GST: {customer.gstNumber}</span>}
            </div>
          </div>

          {customer.followUpDate && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Next Follow-up: {customer.followUpDate}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Mobile Contact</span>
            <div className="font-mono text-slate-200 font-semibold text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{customer.mobile}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Email Address</span>
            <div className="text-slate-200 font-semibold text-xs flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>{customer.email}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Billing & Delivery Address</span>
            <div className="text-slate-200 text-xs flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{customer.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Notes Timeline & Add Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes Timeline */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">CRM Follow-up Notes & Interactions</h3>
          </div>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No follow-up notes recorded yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-sky-400">{n.createdBy}</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(n.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{n.note}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Note Card */}
        <div className="glass-card p-6 rounded-2xl h-fit space-y-4">
          <h3 className="font-bold text-white text-base">Add Follow-up Note</h3>

          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={4}
              required
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-3 rounded-xl glass-input text-xs"
              placeholder="Enter meeting summary, client feedback, or follow-up status update..."
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Posting Note...' : 'Post Follow-up Note'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
