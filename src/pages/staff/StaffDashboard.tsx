import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle,
  Volume2,
  Play,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  QrCode,
  AlertCircle,
  MonitorCheck,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { queueService, QueueStatusResponse } from '../../services/queueService';
import { QRScannerModal } from '../../components/QRScannerModal';
import { StopServiceModal } from '../../components/StopServiceModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StatsCard } from '../../components/StatsCard';
import { useSocket } from '../../hooks/useSocket';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();

  const [branches, setBranches] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '');
  const [selectedCounterId, setSelectedCounterId] = useState<string>(user?.counterId || '');

  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialToken, setScannerInitialToken] = useState<string>('');
  const [scannerInitialMode, setScannerInitialMode] = useState<'camera' | 'manual'>('camera');
  const [promptCustomerToken, setPromptCustomerToken] = useState<any | null>(null);
  const [stopTargetToken, setStopTargetToken] = useState<any | null>(null);
  const [stopModalError, setStopModalError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load initial branches & counters
  useEffect(() => {
    adminService.getBranches().then(res => {
      if (res.success && res.branches?.length > 0) {
        setBranches(res.branches);
        if (!selectedBranchId) {
          setSelectedBranchId(res.branches[0]._id);
        }
      }
    });
  }, []);

  // When branch changes, fetch counters
  useEffect(() => {
    if (!selectedBranchId) return;
    adminService.getCounters(selectedBranchId).then(res => {
      if (res.success && res.counters?.length > 0) {
        setCounters(res.counters);
        if (!selectedCounterId) {
          setSelectedCounterId(res.counters[0]._id);
        }
      } else {
        setCounters([]);
        setSelectedCounterId('');
      }
    });
  }, [selectedBranchId]);

  // Load Queue Status
  const loadQueue = async () => {
    if (!selectedBranchId) return;
    try {
      const res = await queueService.getBranchQueue(selectedBranchId);
      if (res.success) {
        setQueueStatus(res);
      }
    } catch (err: any) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [selectedBranchId]);

  // Socket Live Queue Updates
  useSocket({
    branchId: selectedBranchId,
    onQueueUpdated: () => {
      loadQueue();
    },
    onTokenCalled: () => {
      loadQueue();
    },
    onServiceCompleted: () => {
      loadQueue();
    }
  });

  // Current counter serving token
  const currentCounter = counters.find(c => c._id === selectedCounterId);
  const servingToken = queueStatus?.serving.find(t => t.counterId === selectedCounterId);
  const calledToken = queueStatus?.called.find(t => t.counterId === selectedCounterId);
  const activeTokenAtCounter = servingToken || calledToken;
  const nextInLine = queueStatus?.waiting[0] || null;

  // Actions
  const handleCallNext = async () => {
    if (!selectedBranchId || !selectedCounterId) {
      setMessage({ text: 'Please select a branch and counter desk.', type: 'error' });
      return;
    }
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await queueService.callNext(selectedBranchId, selectedCounterId);
      setMessage({ text: `Token ${res.token.tokenNumber} called to counter.`, type: 'success' });
      await loadQueue();
    } catch (err: any) {
      setMessage({ text: err.message || 'No customers waiting', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async (tokenId: string) => {
    if (actionLoading) return; // Prevent duplicate clicks
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await queueService.startService(tokenId);
      setMessage({ text: `Service started for token ${res.token?.tokenNumber || 'customer'}.`, type: 'success' });
      setPromptCustomerToken(null);
      await loadQueue();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to start service';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStopModal = (token: any) => {
    setStopTargetToken(token || activeTokenAtCounter);
    setStopModalError(null);
  };

  const handleConfirmStopService = async (remarks: string) => {
    if (!stopTargetToken) return;
    setActionLoading(true);
    setStopModalError(null);
    try {
      const res = await queueService.completeService(stopTargetToken._id, remarks);
      setMessage({ text: `Token ${res.token.tokenNumber} marked completed!`, type: 'success' });
      setStopTargetToken(null);
      setPromptCustomerToken(null);
      await loadQueue();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to complete service';
      setStopModalError(msg);
      setMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipToken = async (tokenId: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await queueService.skipToken(tokenId, 'Customer not present at counter');
      setMessage({ text: `Token ${res.token.tokenNumber} skipped.`, type: 'success' });
      setPromptCustomerToken(null);
      await loadQueue();
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.message || err.message || 'Failed to skip token', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCustomerClick = (token: any) => {
    if (token.status === 'SERVING') {
      setMessage({ text: `Token ${token.tokenNumber} is currently serving.`, type: 'success' });
      return;
    }
    // Clicking a customer row/token must NOT set SERVING, but prompt verification required
    if (!token.isVerified && token.status !== 'VERIFIED') {
      setMessage({ text: "Please verify the customer's token before serving.", type: 'error' });
      setPromptCustomerToken(token);
    } else {
      setMessage({ text: `Token ${token.tokenNumber} is verified and ready for service.`, type: 'success' });
    }
  };

  const handleScanSuccess = (scanData: any) => {
    setMessage({ text: `Token ${scanData.token.tokenNumber} verified via QR pass!`, type: 'success' });
    loadQueue();
  };

  if (loading) {
    return <LoadingSpinner message="Initializing staff terminal..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Counter Desk Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {currentCounter ? currentCounter.name : 'Counter Station'}
          </h1>
        </div>

        {/* Counter & Branch Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
            >
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          )}

          {counters.length > 0 && (
            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
            >
              {counters.map(c => (
                <option key={c._id} value={c._id}>{c.name} (#{c.counterNumber})</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Scan QR
          </button>
        </div>
      </div>

      {/* Action Flash Message */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline text-[10px]">Dismiss</button>
        </div>
      )}

      {/* Verification Required Banner (Issue 4) */}
      {promptCustomerToken && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Token verification required for {promptCustomerToken.tokenNumber}
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Please verify the customer's token before serving.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScannerInitialToken(promptCustomerToken.tokenNumber || '');
                setScannerInitialMode('camera');
                setIsScannerOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              SCAN CUSTOMER QR
            </button>
            <button
              type="button"
              onClick={() => {
                setScannerInitialToken(promptCustomerToken.tokenNumber || '');
                setScannerInitialMode('manual');
                setIsScannerOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-850 text-amber-900 dark:text-amber-200 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              ENTER TOKEN MANUALLY
            </button>
          </div>
        </div>
      )}

      {/* 3D KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Current Token"
          value={activeTokenAtCounter?.tokenNumber || 'Idle'}
          icon={Play}
          color="indigo"
          isMonospace={true}
          subtitle={activeTokenAtCounter ? `Desk ${currentCounter?.counterNumber || 1}` : 'Ready for next'}
        />
        <StatsCard
          title="Next Token"
          value={nextInLine?.tokenNumber || 'None'}
          icon={TrendingUp}
          color="purple"
          isMonospace={true}
          subtitle={nextInLine ? `${nextInLine.serviceName || 'Next in line'}` : 'Queue is clear'}
        />
        <StatsCard
          title="Waiting Customers"
          value={queueStatus?.totalWaiting || 0}
          icon={Users}
          color="amber"
          subtitle="Awaiting desk call"
        />
        <StatsCard
          title="Average Wait"
          value={`~${nextInLine?.estimatedWaitTime || 10}m`}
          icon={Clock}
          color="cyan"
          subtitle="Dynamic prediction"
        />
        <StatsCard
          title="Avg Service Time"
          value="8m"
          icon={CheckCircle}
          color="emerald"
          subtitle="Rolling counter average"
        />
      </div>

      {/* ACTIVE COUNTER ACTION BAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Counter Card */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Counter Slot
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentCounter?.name}
              </h2>
            </div>
            {activeTokenAtCounter ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-pulse">
                {activeTokenAtCounter.status}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                Ready for Next
              </span>
            )}
          </div>

          {activeTokenAtCounter ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-white dark:from-slate-850 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/60 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Token Number
                  </span>
                  <div className="text-5xl font-mono font-black text-slate-900 dark:text-white mt-1">
                    {activeTokenAtCounter.tokenNumber}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Service Type</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {activeTokenAtCounter.serviceName || 'General Consultation'}
                  </span>
                  {activeTokenAtCounter.priority !== 'NORMAL' && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-rose-500 uppercase px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                      {activeTokenAtCounter.priority} PRIORITY
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons for current customer */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {activeTokenAtCounter.status === 'SERVING' ? (
                  <button
                    onClick={() => handleOpenStopModal(activeTokenAtCounter)}
                    disabled={actionLoading}
                    className="col-span-2 sm:col-span-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Stop Service
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartService(activeTokenAtCounter._id)}
                    disabled={actionLoading}
                    className="col-span-2 sm:col-span-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>{actionLoading ? 'Starting...' : 'Start Service'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleSkipToken(activeTokenAtCounter._id)}
                  disabled={actionLoading}
                  className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>

                <button
                  onClick={handleCallNext}
                  disabled={actionLoading || (queueStatus?.totalWaiting || 0) === 0}
                  className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  Call Next In Line
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Counter is Free</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {nextInLine ? `Next customer waiting is ${nextInLine.tokenNumber}.` : 'No customers currently waiting in queue.'}
                </p>
              </div>
              <button
                onClick={handleCallNext}
                disabled={actionLoading || (queueStatus?.totalWaiting || 0) === 0}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer inline-flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Call Next Token
              </button>
            </div>
          )}
        </div>

        {/* Waiting Queue Stream */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Waiting Queue ({queueStatus?.totalWaiting || 0})
            </h3>
            <Link
              to="/staff/queue"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Full Queue List
            </Link>
          </div>

          {queueStatus?.waiting && queueStatus.waiting.length > 0 ? (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {queueStatus.waiting.map((token, index) => (
                <div
                  key={token._id}
                  onClick={() => handleCustomerClick(token)}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-[11px] flex items-center justify-center text-slate-700 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block text-sm">
                          {token.tokenNumber}
                        </span>
                        {token.isVerified || token.status === 'VERIFIED' ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Verify Required
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Wait: ~{token.estimatedWaitTime}m</span>
                    </div>
                  </div>

                  {token.priority !== 'NORMAL' && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                      {token.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No customers in line.
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setScannerInitialToken('');
        }}
        branchId={selectedBranchId}
        counterId={selectedCounterId}
        initialTokenNumber={scannerInitialToken}
        initialMode={scannerInitialMode}
        onScanSuccess={handleScanSuccess}
      />

      {/* Stop Service Remarks Modal (REQ 3) */}
      {stopTargetToken && (
        <StopServiceModal
          isOpen={!!stopTargetToken}
          onClose={() => {
            setStopTargetToken(null);
            setStopModalError(null);
          }}
          onConfirm={handleConfirmStopService}
          customerName={stopTargetToken.customerName || stopTargetToken.customer?.name || 'Customer'}
          tokenNumber={stopTargetToken.tokenNumber}
          serviceName={stopTargetToken.serviceName || 'General Consultation'}
          loading={actionLoading}
          error={stopModalError}
        />
      )}
    </div>
  );
};
