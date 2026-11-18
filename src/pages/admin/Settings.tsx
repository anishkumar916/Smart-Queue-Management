import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    maxQueueSize: 100,
    defaultServiceTime: 10,
    priorityEnabled: true,
    notificationEnabled: true,
    tokenPrefix: 'A'
  });

  useEffect(() => {
    adminService
      .getBranches()
      .then((res) => {
        if (res.success && res.branches?.length > 0) {
          setBranches(res.branches);
          setSelectedBranchId(res.branches[0]._id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    adminService.getSettings(selectedBranchId).then((res) => {
      if (res.success && res.settings) {
        setSettings({
          maxQueueSize: res.settings.maxQueueSize || 100,
          defaultServiceTime: res.settings.defaultServiceTime || 10,
          priorityEnabled: res.settings.priorityEnabled ?? true,
          notificationEnabled: res.settings.notificationEnabled ?? true,
          tokenPrefix: res.settings.tokenPrefix || 'A'
        });
      }
    });
  }, [selectedBranchId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Form validation
    if (!selectedBranchId) {
      setErrorMsg('Please select a target branch.');
      return;
    }

    if (!settings.maxQueueSize || settings.maxQueueSize < 1) {
      setErrorMsg('Maximum queue capacity must be at least 1.');
      return;
    }

    if (!settings.defaultServiceTime || settings.defaultServiceTime < 1) {
      setErrorMsg('Default service time must be at least 1 minute.');
      return;
    }

    if (!settings.tokenPrefix || !settings.tokenPrefix.trim()) {
      setErrorMsg('Token prefix is required (e.g. A, B, C).');
      return;
    }

    setSaving(true);
    try {
      // Call backend API
      const res = await adminService.updateSettings(selectedBranchId, settings);
      if (res && res.success !== false) {
        setSuccessMsg('Queue settings saved successfully! Navigating to dashboard...');
        // Only after backend success, navigate to the appropriate admin page
        setTimeout(() => {
          navigate('/admin');
        }, 600);
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err: any) {
      // On API failure, stay on the page, show an error, keep entered data. No full page reload.
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading queue rules..." size="lg" />;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-500" />
          Queue Capacity & Prediction Rules
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Configure maximum queue load, token numbering prefixes, and statistical waiting defaults.
        </p>
      </div>

      {/* Branch selector */}
      {branches.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Target Branch:
          </span>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
          >
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Maximum Queue Capacity (Per Day)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              required
              value={settings.maxQueueSize}
              onChange={(e) => setSettings({ ...settings, maxQueueSize: Number(e.target.value) })}
              style={{ color: '#ffffff' }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              System rejects new joins once limit reached
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Service Time (Minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              required
              value={settings.defaultServiceTime}
              onChange={(e) => setSettings({ ...settings, defaultServiceTime: Number(e.target.value) })}
              style={{ color: '#ffffff' }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Fallback baseline before rolling avg adapts
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Token Number Prefix
            </label>
            <input
              type="text"
              maxLength={3}
              required
              value={settings.tokenPrefix}
              onChange={(e) => setSettings({ ...settings, tokenPrefix: e.target.value.toUpperCase() })}
              style={{ color: '#ffffff' }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold uppercase"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              e.g. A produces A001, A002
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="priorityToggle"
              checked={settings.priorityEnabled}
              onChange={(e) => setSettings({ ...settings, priorityEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
            />
            <label htmlFor="priorityToggle" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              Enable Emergency & Priority Fast-Tracking
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notifToggle"
              checked={settings.notificationEnabled}
              onChange={(e) => setSettings({ ...settings, notificationEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
            />
            <label htmlFor="notifToggle" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              Send Automatic Approaching Turn Alerts
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'COMPLETED'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
export default Settings;
