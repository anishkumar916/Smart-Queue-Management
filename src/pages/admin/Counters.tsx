import React, { useState, useEffect } from 'react';
import { MonitorCheck, Plus, Edit2, Trash2, User, Power, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const Counters: React.FC = () => {
  const [counters, setCounters] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<any>(null);

  const [formData, setFormData] = useState({
    branchId: '',
    counterNumber: '',
    name: '',
    assignedStaffId: ''
  });

  const loadData = async () => {
    try {
      const [counterRes, branchRes, userRes] = await Promise.all([
        adminService.getCounters(),
        adminService.getBranches(),
        adminService.getUsers('STAFF')
      ]);
      if (counterRes.success) setCounters(counterRes.counters || []);
      if (branchRes.success) {
        setBranches(branchRes.branches || []);
        if (branchRes.branches?.length > 0 && !formData.branchId) {
          setFormData(prev => ({ ...prev, branchId: branchRes.branches[0]._id }));
        }
      }
      if (userRes.success) setStaffList(userRes.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCounter(null);
    setFormData({
      branchId: branches[0]?._id || '',
      counterNumber: String(counters.length + 1),
      name: `Counter ${counters.length + 1}`,
      assignedStaffId: staffList[0]?._id || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (counter: any) => {
    setEditingCounter(counter);
    setFormData({
      branchId: counter.branchId,
      counterNumber: counter.counterNumber,
      name: counter.name,
      assignedStaffId: counter.assignedStaffId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCounter) {
      await adminService.updateCounter(editingCounter._id, formData);
    } else {
      await adminService.createCounter(formData);
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleToggleActive = async (id: string) => {
    await adminService.toggleCounterActive(id);
    loadData();
  };

  if (loading) {
    return <LoadingSpinner message="Loading counter bays..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MonitorCheck className="w-6 h-6 text-indigo-500" />
            Service Counter Desks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Physical stations, terminal numbering, staff operator assignment, and availability toggles.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Counter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {counters.map((c) => (
          <div
            key={c._id}
            className={`p-6 rounded-3xl border transition shadow-sm space-y-4 ${
              c.isActive
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 font-mono font-black text-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  #{c.counterNumber}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{c.name}</h3>
                  <span className="text-xs text-slate-400">
                    {c.staffName ? `Operator: ${c.staffName}` : 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleToggleActive(c._id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  c.isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{c.isActive ? 'Active (Open)' : 'Inactive (Closed)'}</span>
              </button>

              <span className="text-[10px] text-slate-400">
                {c.currentTokenId ? 'Serving customer' : 'Idle / Ready'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingCounter ? 'Edit Counter' : 'Create Counter'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  style={{ color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Counter Number</label>
                <input
                  type="text"
                  required
                  value={formData.counterNumber}
                  onChange={(e) => setFormData({ ...formData, counterNumber: e.target.value })}
                  style={{ color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Counter Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Assigned Staff Operator</label>
                <select
                  value={formData.assignedStaffId}
                  onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                  style={{ color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- None / Rotate --</option>
                  {staffList.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  Save Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
