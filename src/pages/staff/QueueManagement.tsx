import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Play,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  QrCode,
  Users,
  Search,
  AlertCircle,
  Eye,
  Filter,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { queueService, QueueStatusResponse } from '../../services/queueService';
import { tokenService, Token } from '../../services/tokenService';
import { QRScannerModal } from '../../components/QRScannerModal';
import { StopServiceModal } from '../../components/StopServiceModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { useSocket } from '../../hooks/useSocket';

export const QueueManagement: React.FC = () => {
  const { user } = useAuth();

  const [branches, setBranches] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '');
  const [selectedCounterId, setSelectedCounterId] = useState<string>(user?.counterId || '');

  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCustomerToken, setSelectedCustomerToken] = useState<any>(null);
  const [scannerInitialToken, setScannerInitialToken] = useState<string>('');
  const [scannerInitialMode, setScannerInitialMode] = useState<'camera' | 'manual'>('camera');
  const [promptCustomerToken, setPromptCustomerToken] = useState<any | null>(null);
  const [stopTargetToken, setStopTargetToken] = useState<any | null>(null);
  const [stopModalError, setStopModalError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filterTab, setFilterTab] = useState<'WAITING' | 'SERVING' | 'CALLED' | 'ALL'>('WAITING');

  useEffect(() => {
    adminService.getBranches().then(res => {
      if (res.success && res.branches?.length > 0) {
        setBranches(res.branches);
        if (!selectedBranchId) setSelectedBranchId(res.branches[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    adminService.getCounters(selectedBranchId).then(res => {
      if (res.success && res.counters?.length > 0) {
        setCounters(res.counters);
        if (!selectedCounterId) setSelectedCounterId(res.counters[0]._id);
      }
    });
  }, [selectedBranchId]);

  const loadQueue = async () => {
    if (!selectedBranchId) return;
    try {
      const res = await queueService.getBranchQueue(selectedBranchId);
      if (res.success) setQueueStatus(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [selectedBranchId]);

  useSocket({
    branchId: selectedBranchId,
    onQueueUpdated: () => loadQueue(),
    onTokenCalled: () => loadQueue(),
    onServiceCompleted: () => loadQueue()
  });

  const handleCallNext = async () => {
    if (!selectedBranchId || !selectedCounterId) {
      setMessage({ text: 'Select branch and counter', type: 'error' });
      return;
    }
    try {
      const res = await queueService.callNext(selectedBranchId, selectedCounterId);
      setMessage({ text: `Token ${res.token.tokenNumber} called to desk.`, type: 'success' });
      loadQueue();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleStartService = async (tokenId: string) => {
    if (actionLoading) return; // Prevent duplicate clicks
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await queueService.startService(tokenId);
      setMessage({ text: `Service started for ${res.token?.tokenNumber || 'token'}.`, type: 'success' });
      setPromptCustomerToken(null);
      loadQueue();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to start service';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStopModal = (token: any) => {
    setStopTargetToken(token);
    setStopModalError(null);
  };

  const handleConfirmStopService = async (remarks: string) => {
    if (!stopTargetToken) return;
    setActionLoading(true);
    setStopModalError(null);
    try {
      const res = await queueService.completeService(stopTargetToken._id, remarks);
      setMessage({ text: `Token ${res.token.tokenNumber} completed.`, type: 'success' });
      setStopTargetToken(null);
      setPromptCustomerToken(null);
      loadQueue();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to complete service';
      setStopModalError(msg);
      setMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (tokenId: string) => {
    try {
      const res = await queueService.skipToken(tokenId, 'Customer not present at counter');
      setMessage({ text: `Token ${res.token.tokenNumber} skipped.`, type: 'success' });
      setPromptCustomerToken(null);
      loadQueue();
    } catch (err: any) {
      setMessage({ text: err?.response?.data?.message || err.message || 'Failed to skip token', type: 'error' });
    }
  };

  const handleRecall = async (tokenId: string) => {
    if (!selectedCounterId) {
      setMessage({ text: 'Select a counter to recall to.', type: 'error' });
      return;
    }
    try {
      const res = await queueService.recallToken(tokenId, selectedCounterId);
      setMessage({ text: `Token ${res.token.tokenNumber} recalled.`, type: 'success' });
      loadQueue();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
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

  if (loading) {
    return <LoadingSpinner message="Loading queue management desk..." size="lg" />;
  }

  // Aggregate tokens according to filter
  const allList = [
    ...(queueStatus?.serving || []),
    ...(queueStatus?.called || []),
    ...(queueStatus?.waiting || [])
  ];

  const displayedList =
    filterTab === 'WAITING'
      ? queueStatus?.waiting || []
      : filterTab === 'SERVING'
      ? queueStatus?.serving || []
      : filterTab === 'CALLED'
      ? queueStatus?.called || []
      : allList;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Queue Control Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time management for calling, serving, skipping, and recalling tokens.
          </p>
        </div>

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
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Scan QR
          </button>

          <button
            onClick={handleCallNext}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            Call Next
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setFilterTab('WAITING')}
          className={`pb-3 transition border-b-2 cursor-pointer ${
            filterTab === 'WAITING'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Waiting ({queueStatus?.waiting.length || 0})
        </button>
        <button
          onClick={() => setFilterTab('CALLED')}
          className={`pb-3 transition border-b-2 cursor-pointer ${
            filterTab === 'CALLED'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Called ({queueStatus?.called.length || 0})
        </button>
        <button
          onClick={() => setFilterTab('SERVING')}
          className={`pb-3 transition border-b-2 cursor-pointer ${
            filterTab === 'SERVING'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Currently Serving ({queueStatus?.serving.length || 0})
        </button>
        <button
          onClick={() => setFilterTab('ALL')}
          className={`pb-3 transition border-b-2 cursor-pointer ${
            filterTab === 'ALL'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Active ({allList.length})
        </button>
      </div>

      {/* Table list of tokens */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Token #</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Position / Wait</th>
                <th className="px-6 py-4">Counter</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No tokens found in this status category.
                  </td>
                </tr>
              ) : (
                displayedList.map((token: any) => (
                  <tr
                    key={token._id}
                    onClick={() => handleCustomerClick(token)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        {token.tokenNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          token.priority === 'EMERGENCY'
                            ? 'bg-rose-500 text-white'
                            : token.priority === 'PRIORITY'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {token.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div>Pos #{token.queuePosition || 1}</div>
                      <span className="text-[10px] text-slate-400">~{token.estimatedWaitTime}m wait</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {token.counterName || (token.counterId ? `Counter ${token.counterId}` : '--')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {(token.status === 'CALLED' || token.status === 'VERIFIED') && (
                          <button
                            onClick={() => handleStartService(token._id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50"
                            title="Start Service"
                          >
                            {actionLoading ? 'Starting...' : 'Start'}
                          </button>
                        )}

                        {token.status === 'SERVING' && (
                          <button
                            onClick={() => handleOpenStopModal(token)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-500 transition cursor-pointer"
                            title="Stop Service"
                          >
                            Stop
                          </button>
                        )}

                        {['CALLED', 'SERVING', 'VERIFIED'].includes(token.status) && (
                          <button
                            onClick={() => handleSkip(token._id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-semibold text-[11px] hover:bg-amber-400 transition cursor-pointer"
                            title="Skip Token"
                          >
                            Skip
                          </button>
                        )}

                        {token.status === 'WAITING' && (
                          <button
                            onClick={() => handleRecall(token._id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[11px] hover:bg-indigo-500 transition cursor-pointer"
                            title="Call this Token directly"
                          >
                            Call
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner */}
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
        onScanSuccess={(data) => {
          setMessage({ text: `Token ${data.token.tokenNumber} verified!`, type: 'success' });
          loadQueue();
        }}
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
          serviceName={stopTargetToken.serviceName || 'General Service'}
          loading={actionLoading}
          error={stopModalError}
        />
      )}
    </div>
  );
};
