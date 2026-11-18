import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  GitBranch,
  Layers,
  Ticket,
  Clock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { tokenService, Token } from '../../services/tokenService';
import { TokenCard } from '../../components/TokenCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const JoinQueue: React.FC = () => {
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<Token | null>(null);

  // Load organizations
  useEffect(() => {
    adminService.getOrganizations().then(res => {
      if (res.success && res.organizations?.length > 0) {
        setOrgs(res.organizations);
        setSelectedOrgId(res.organizations[0]._id);
      }
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // When org changes, load branches
  useEffect(() => {
    if (!selectedOrgId) return;
    adminService.getBranches(selectedOrgId).then(res => {
      if (res.success && res.branches?.length > 0) {
        setBranches(res.branches);
        setSelectedBranchId(res.branches[0]._id);
      } else {
        setBranches([]);
        setSelectedBranchId('');
      }
    });
  }, [selectedOrgId]);

  // When branch changes, load services
  useEffect(() => {
    if (!selectedBranchId) return;
    adminService.getServices(selectedBranchId).then(res => {
      if (res.success && res.services?.length > 0) {
        setServices(res.services);
        setSelectedServiceId(res.services[0]._id);
      } else {
        setServices([]);
        setSelectedServiceId('');
      }
    });
  }, [selectedBranchId]);

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !selectedServiceId) {
      setError('Please select an active branch and service.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await tokenService.joinQueue(selectedBranchId, selectedServiceId);
      if (res.success && res.token) {
        setGeneratedToken(res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate token.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading services and locations..." size="lg" />;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Join a Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Select an organization, choose your nearest branch, and generate your digital fast-pass token.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success generated state */}
      {generatedToken ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Token successfully generated! You are in line. Save your QR pass or track your progress below.
            </span>
          </div>

          <TokenCard token={generatedToken} showQRByDefault={true} />

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer')}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition cursor-pointer"
            >
              Go to Customer Dashboard
            </button>
            <button
              onClick={() => navigate(`/customer/token/${generatedToken._id}`)}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-xs transition cursor-pointer"
            >
              View Full Ticket
            </button>
          </div>
        </div>
      ) : (
        /* Selection Flow */
        <form onSubmit={handleGenerateToken} className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* 1. Organization */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-500" />
              1. Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              style={{ color: '#ffffff' }}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {orgs.map((o) => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Branch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-purple-500" />
              2. Branch Location
            </label>
            {branches.length > 0 ? (
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{ color: '#ffffff' }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.address || 'Standard Location'})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500">No active branches for this organization.</p>
            )}
          </div>

          {/* 3. Service */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              3. Service Required
            </label>
            {services.length > 0 ? (
              <div className="space-y-2">
                {services.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => setSelectedServiceId(s._id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                      selectedServiceId === s._id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        ~{s.averageServiceTime} mins
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No services configured for this branch.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedBranchId || !selectedServiceId}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <Ticket className="w-4 h-4" />
            <span>{submitting ? 'Issuing Token...' : 'Generate Digital Token'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
