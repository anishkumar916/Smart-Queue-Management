import React from 'react';
import { Users, Clock, ArrowDown, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

interface QueueProgressVisualizerProps {
  myTokenNumber: string;
  currentServingToken?: string;
  queuePosition: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  status: string;
}

export const QueueProgressVisualizer: React.FC<QueueProgressVisualizerProps> = ({
  myTokenNumber,
  currentServingToken = '--',
  queuePosition,
  peopleAhead,
  estimatedWaitMinutes,
  status
}) => {
  // Build stepping tokens between Now Serving and My Token
  const steps: { label: string; tokenNumber: string; isUser: boolean; isServing: boolean; isIntermediate: boolean }[] = [];

  // Parse token letter and number if possible, e.g. A025
  const match = myTokenNumber.match(/^([A-Za-z]+)(\d+)$/);
  const prefix = match ? match[1] : 'A';
  const myNum = match ? parseInt(match[2], 10) : 25;

  const servingMatch = currentServingToken.match(/^([A-Za-z]+)(\d+)$/);
  const servingNum = servingMatch ? parseInt(servingMatch[2], 10) : Math.max(1, myNum - peopleAhead - 1);

  // 1. My Token (YOU)
  steps.push({
    label: 'YOU',
    tokenNumber: myTokenNumber,
    isUser: true,
    isServing: false,
    isIntermediate: false
  });

  // Intermediate steps (up to 3 intermediate ahead)
  const stepsAhead = Math.min(3, Math.max(0, peopleAhead));
  for (let i = 1; i <= stepsAhead; i++) {
    const interNum = Math.max(1, myNum - i);
    const formatted = `${prefix}${String(interNum).padStart(3, '0')}`;
    steps.push({
      label: `${i} ahead`,
      tokenNumber: formatted,
      isUser: false,
      isServing: false,
      isIntermediate: true
    });
  }

  // Final step: NOW SERVING
  if (currentServingToken && currentServingToken !== '--' && currentServingToken !== myTokenNumber) {
    steps.push({
      label: 'NOW SERVING',
      tokenNumber: currentServingToken,
      isUser: false,
      isServing: true,
      isIntermediate: false
    });
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.05),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Queue Position Flow
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Live order to the service desk</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            {status === 'SERVING' ? 'At Counter' : status === 'CALLED' ? 'Called Now' : `${peopleAhead} Ahead`}
          </span>
        </div>
      </div>

      {/* Visual Sequence Pipeline */}
      <div className="space-y-2 py-1">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div
              className={`relative flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 ${
                step.isUser
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 transform -translate-y-0.5'
                  : step.isServing
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 shadow-sm'
                  : 'bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
              }`}
            >
              {/* Left identifier & badge */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full flex items-center justify-center ${
                    step.isUser
                      ? 'bg-white text-indigo-700 ring-4 ring-white/30'
                      : step.isServing
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <div>
                  <span
                    className={`block text-[10px] font-extrabold uppercase tracking-widest ${
                      step.isUser
                        ? 'text-indigo-200'
                        : step.isServing
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`font-mono font-black text-base ${
                      step.isUser ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {step.tokenNumber}
                  </span>
                </div>
              </div>

              {/* Right pill */}
              <div className="text-right">
                {step.isUser ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs">
                    Your Turn Next
                  </span>
                ) : step.isServing ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    Counter Desk
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Waiting
                  </span>
                )}
              </div>
            </div>

            {/* Downward connecting arrow if not last item */}
            {idx < steps.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <ArrowDown className="w-3 h-3 animate-pulse" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
