import React, { useState, useEffect } from 'react';
import { X, Play, AlertCircle } from 'lucide-react';

interface StartServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => Promise<void>;
  customerName: string;
  tokenNumber: string;
  serviceName: string;
  loading?: boolean;
  error?: string | null;
}

export const StartServiceModal: React.FC<StartServiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  tokenNumber,
  serviceName,
  loading = false,
  error = null
}) => {
  const [remarks, setRemarks] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reset remarks only when opening for a new token, but preserve when an error occurs
  useEffect(() => {
    if (isOpen && !error) {
      // keep current remarks if user typed before or start fresh
    }
  }, [isOpen, tokenNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(remarks);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Bar */}
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Play className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Start Service
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Confirm service commencement
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto overscroll-contain flex-1">
          {/* Error Message if API fails */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Existing Data: Customer Name, Token, Service */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer
              </span>
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {customerName || 'Customer'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Token
              </span>
              <p className="font-mono font-black text-indigo-600 dark:text-indigo-400 truncate">
                {tokenNumber}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Service
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {serviceName || 'Service'}
              </p>
            </div>
          </div>

          {/* Staff Remarks Field */}
          <div>
            <label
              htmlFor="staffRemarksTextarea"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Staff Remarks
            </label>
            <textarea
              id="staffRemarksTextarea"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks for the customer..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition placeholder:text-slate-400 resize-none shadow-xs"
            />
          </div>

          {/* Action Buttons: [CANCEL] [START SERVICE] */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{loading ? 'Starting...' : 'START SERVICE'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
