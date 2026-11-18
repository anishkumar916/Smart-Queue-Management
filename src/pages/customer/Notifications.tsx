import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';
import { notificationService, NotificationItem } from '../../services/notificationService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await notificationService.getMyNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (loading) {
    return <LoadingSpinner message="Loading notifications..." size="lg" />;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time queue calls, turn approach alerts, and completion notices.
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You are all caught up! You will receive live alerts when your token is called."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n._id}
              className={`p-4 rounded-2xl border transition ${
                n.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-slate-900 dark:text-white ring-1 ring-indigo-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="font-bold text-sm">{n.title}</h3>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
