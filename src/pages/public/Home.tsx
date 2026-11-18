import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Search,
  Activity,
  Zap,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { QueueStatus } from '../../components/QueueStatus';
import { queueService } from '../../services/queueService';

export const Home: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [boardData, setBoardData] = useState<any>({
    nowServing: 'A003',
    next: 'A004',
    waiting: ['A005', 'A006', 'A007'],
    totalWaiting: 3,
    activeCounters: 2
  });
  const [tokenSearch, setTokenSearch] = useState('');

  useEffect(() => {
    adminService.getBranches().then(res => {
      if (res.success && res.branches?.length > 0) {
        setBranches(res.branches);
        setSelectedBranchId(res.branches[0]._id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    queueService.getQueueStatusBoard(selectedBranchId).then(res => {
      if (res.success) {
        setBoardData(res);
      }
    }).catch(() => {});
  }, [selectedBranchId]);

  const selectedBranch = branches.find(b => b._id === selectedBranchId);

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/30 via-slate-900/10 to-transparent p-6 sm:p-12 border border-slate-200/60 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold ring-1 ring-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Smart Queue & Wait-Time Prediction</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Skip the Queue. Own Your Time.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join digitally, track your place, and know when it's your turn.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/join"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition transform active:scale-95"
            >
              <Ticket className="w-4 h-4" />
              Join Queue Remotely
            </Link>

            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm border border-slate-200 dark:border-slate-700 transition"
            >
              <Search className="w-4 h-4 text-indigo-500" />
              Track Token Pass
            </Link>

            <Link
              to="/live"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-sm transition"
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              Public Queue Display
            </Link>
          </div>
        </div>
      </section>

      {/* LIVE DIGITAL DISPLAY PREVIEW */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Real-Time Queue Display
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live WebSocket updates synchronized across all counters and customer devices.
            </p>
          </div>

          {branches.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Select Branch:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <QueueStatus
          nowServing={boardData.nowServing}
          next={boardData.next}
          waiting={boardData.waiting}
          totalWaiting={boardData.totalWaiting}
          activeCounters={boardData.activeCounters}
          estimatedWaitMinutes={boardData.totalWaiting * 4 || 8}
          branchName={selectedBranch ? selectedBranch.name : 'Metropolis Central Branch'}
        />
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            How The Smart Queue Works
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A seamless three-step journey engineered to remove crowded queues and waiting anxiety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Select Branch & Service</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Choose your target organization, select the active branch, and pick the desired service category.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Receive Digital QR Token</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Instantly receive a verified digital token number and QR fast-pass. See people ahead and predicted wait time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Arrive on Your Turn</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Wait from anywhere. Receive instant in-app alerts when your turn approaches. Staff scans QR and serves immediately.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Enterprise Architecture
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Engineered with modern full-stack technologies for mission-critical reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Zap className="w-6 h-6 text-indigo-500" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Waiting-Time Prediction</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Statistical algorithms calculate rolling service durations, counter concurrency, and queue velocity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <QrCode className="w-6 h-6 text-purple-500" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">QR Fast-Pass Verification</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automatic digital QR pass generation for customers and built-in camera scanner for counter staff.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Socket.IO Live Sync</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant multi-user updates whenever tokens are called, completed, or skipped without browser reload.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Role-Based Access</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Custom specialized dashboards for Customers, Counter Staff, and System Administrators.
            </p>
          </div>
        </div>
      </section>

      {/* SECTOR USE CASES */}
      <section className="rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Built for High-Footfall Organizations
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          From hospital triage desks to financial retail windows and citizen municipal centers, Smart Queue organizes physical crowds with predictable wait times.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            🏥 Hospitals & Clinics
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            🏦 Banks & Financial Desks
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            🏛️ Citizen & Government Hubs
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            🎓 Universities & Registrar Offices
          </span>
        </div>
      </section>
    </div>
  );
};
