import React, { useState, useEffect } from 'react';
import { tokenService, Token } from '../../services/tokenService';
import { TokenCard } from '../../components/TokenCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { History, Calendar, Clock, Filter } from 'lucide-react';

export const TokenHistory: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    tokenService.getMyTokens().then(res => {
      if (res.success) {
        const all = [...(res.activeTokens || []), ...(res.history || [])];
        setTokens(all);
        setFilteredTokens(all);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredTokens(tokens);
    } else {
      setFilteredTokens(tokens.filter(t => t.status === statusFilter));
    }
  }, [statusFilter, tokens]);

  if (loading) {
    return <LoadingSpinner message="Loading token history..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-500" />
            Token History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Audit log of your previous clinic, bank, and service visits.
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          {['ALL', 'COMPLETED', 'WAITING', 'CANCELLED', 'SKIPPED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {filteredTokens.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Tokens Found"
          description={`No past tokens match status filter "${statusFilter}".`}
          actionText="Join a Queue"
          onAction={() => window.location.assign('/customer/join')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTokens.map(token => (
            <TokenCard key={token._id} token={token} />
          ))}
        </div>
      )}
    </div>
  );
};
