import React, { useState, useEffect } from 'react';
import { QueueStatus } from '../../components/QueueStatus';
import { adminService } from '../../services/adminService';
import { queueService } from '../../services/queueService';
import { useSocket } from '../../hooks/useSocket';
import { Monitor, RefreshCw, Volume2 } from 'lucide-react';

export const LiveBoard: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [boardData, setBoardData] = useState<any>({
    nowServing: '--',
    next: '--',
    waiting: [],
    totalWaiting: 0,
    activeCounters: 1
  });
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    adminService.getBranches().then(res => {
      if (res.success && res.branches?.length > 0) {
        setBranches(res.branches);
        setSelectedBranchId(res.branches[0]._id);
      }
    });
  }, []);

  const loadStatus = () => {
    if (!selectedBranchId) return;
    queueService.getQueueStatusBoard(selectedBranchId).then(res => {
      if (res.success) {
        setBoardData(res);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    });
  };

  useEffect(() => {
    loadStatus();
  }, [selectedBranchId]);

  // Real-time socket sync
  useSocket({
    branchId: selectedBranchId,
    onQueueUpdated: () => {
      loadStatus();
    },
    onTokenCalled: () => {
      loadStatus();
    }
  });

  const selectedBranch = branches.find(b => b._id === selectedBranchId);

  return (
    <div className="space-y-6 py-6">
      {/* Top control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              Public Live Queue Display
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kiosk & Digital Signage Mode • Updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
            >
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={loadStatus}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <QueueStatus
        nowServing={boardData.nowServing}
        next={boardData.next}
        waiting={boardData.waiting}
        totalWaiting={boardData.totalWaiting}
        activeCounters={boardData.activeCounters}
        estimatedWaitMinutes={boardData.totalWaiting * 4 || 6}
        branchName={selectedBranch ? selectedBranch.name : 'Central Branch Queue'}
      />
    </div>
  );
};
