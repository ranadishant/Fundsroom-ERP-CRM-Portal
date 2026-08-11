import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Customer, CustomerType, CustomerStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Phone, Mail, Building, MapPin, Calendar, Edit, MessageSquare, ChevronRight, X } from 'lucide-react';

interface CustomersPageProps {
  onSelectCustomer: (customerId: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onSelectCustomer }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'Wholesale' as CustomerType,
    address: '',
    status: 'Lead' as CustomerStatus,
    followUpDate: '',
    notes: ''
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const data = await apiFetch(`/customers?${params.toString()}`);
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter, typeFilter]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      customerName: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'Wholesale',
      address: '',
      status: 'Lead',
      followUpDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(c);
    setFormData({
      customerName: c.customerName,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate || '',
      notes: c.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await apiFetch(`/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/customers', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Error saving customer');
    }
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales';

  return (
    <div className="p-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-2xl">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, mobile, email, business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl glass-input text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Lead">Lead</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Customer Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl glass-input text-xs font-medium"
          >
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>

        {canEdit && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Customer List Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
                <th className="py-3.5 px-4">Customer / Business</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Type & GST</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Follow-up Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading Customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No customers found matching search criteria.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCustomer(c.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{c.customerName}</div>
                      <div className="text-slate-400 flex items-center gap-1 text-[11px] mt-0.5">
                        <Building className="w-3 h-3 text-sky-400" />
                        <span>{c.businessName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="text-slate-200 flex items-center gap-1.5 font-mono">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{c.mobile}</span>
                      </div>
                      <div className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3 h-3 text-indigo-400" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                        {c.customerType}
                      </span>
                      {c.gstNumber && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">GST: {c.gstNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {c.followUpDate ? (
                        <div className="flex items-center gap-1 text-amber-400 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>{c.followUpDate}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {canEdit && (
                        <button
                          onClick={(e) => openEditModal(c, e)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Customer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition"
                        title="View Details & Notes"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer (CRM)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="e.g. Kumar Traders"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="ramesh@kumartraders.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Type</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  placeholder="27AAAAA0000A1Z5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  placeholder="Street, City, State, Pincode"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial CRM Note</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    placeholder="Initial call outcome or lead origin notes..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-400 transition shadow-md shadow-sky-500/20"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
