import { TokenModel } from '../models/Token';
import { ServiceHistoryModel } from '../models/ServiceHistory';
import { CounterModel } from '../models/Counter';
import { ServiceModel } from '../models/Service';

export interface PredictionResult {
  estimatedWaitMinutes: number;
  peopleAhead: number;
  activeCounters: number;
  averageServiceTimeMinutes: number;
  queueVelocity: number; // tokens completed per hour
  confidenceScore: number; // 0 to 1
  explanation: string;
}

/**
 * Calculates historical rolling average service time for a specific service or branch.
 * Falls back to service configured default or 8 minutes.
 */
export async function calculateAverageServiceTime(serviceId: string, branchId: string): Promise<number> {
  try {
    const histories = await ServiceHistoryModel.find({ serviceId });
    if (histories && histories.length > 0) {
      // Rolling average of the last 20 completions
      const recent = histories.slice(-20);
      const sum = recent.reduce((acc: number, curr: any) => acc + (curr.serviceDuration || 0), 0);
      const avg = sum / recent.length;
      return Math.max(2, Math.round(avg * 10) / 10);
    }

    // Fall back to configured service average
    const service = await ServiceModel.findById(serviceId);
    if (service && service.averageServiceTime) {
      return service.averageServiceTime;
    }
  } catch (err) {
    console.error('Error calculating average service time:', err);
  }
  return 8; // standard fallback
}

/**
 * Calculates how many active counters exist for a branch
 */
export async function getActiveCounterCount(branchId: string): Promise<number> {
  try {
    const activeCounters = await CounterModel.find({ branchId, isActive: true });
    return Math.max(1, activeCounters.length);
  } catch (err) {
    return 1;
  }
}

/**
 * Calculates waiting time using statistical formula:
 * Estimated Waiting Time = (People Ahead * Average Service Time) / Active Counters
 * Enhanced with priority weighting and queue velocity.
 */
export async function calculateEstimatedWaitTime(params: {
  branchId: string;
  serviceId: string;
  queuePosition: number;
  priority?: string;
}): Promise<number> {
  const { branchId, serviceId, queuePosition, priority } = params;

  if (queuePosition <= 1) {
    if (priority === 'EMERGENCY') return 1;
    return 2;
  }

  const avgServiceTime = await calculateAverageServiceTime(serviceId, branchId);
  const activeCounters = await getActiveCounterCount(branchId);

  // People ahead is (queuePosition - 1)
  const peopleAhead = Math.max(0, queuePosition - 1);

  // Raw wait time
  let wait = (peopleAhead * avgServiceTime) / activeCounters;

  // Priority adjustment
  if (priority === 'EMERGENCY') {
    wait = Math.min(2, wait * 0.1);
  } else if (priority === 'PRIORITY') {
    wait = Math.max(3, wait * 0.7);
  }

  return Math.max(1, Math.round(wait));
}

/**
 * Get comprehensive queue prediction analytics for a branch/service
 */
export async function getQueuePrediction(branchId: string, serviceId?: string): Promise<PredictionResult> {
  const query: any = { branchId, status: 'WAITING' };
  if (serviceId) query.serviceId = serviceId;

  const waitingTokens = await TokenModel.find(query);
  const peopleAhead = waitingTokens.length;
  const activeCounters = await getActiveCounterCount(branchId);

  // Calculate average service duration
  const histories = await ServiceHistoryModel.find({ branchId });
  let avgServiceTime = 8;
  if (histories.length > 0) {
    const recent = histories.slice(-20);
    const sum = recent.reduce((acc: number, curr: any) => acc + (curr.serviceDuration || 0), 0);
    avgServiceTime = Math.max(2, Math.round((sum / recent.length) * 10) / 10);
  }

  // Queue velocity: completed in last 60 minutes
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const completedRecent = histories.filter((h: any) => h.completedAt >= oneHourAgo).length;
  const queueVelocity = completedRecent || Math.round((60 / avgServiceTime) * activeCounters);

  const estimatedWaitMinutes = Math.round((peopleAhead * avgServiceTime) / activeCounters);
  const confidenceScore = histories.length >= 10 ? 0.92 : (histories.length >= 3 ? 0.75 : 0.6);

  let explanation = `Based on ${peopleAhead} waiting customers, ${activeCounters} active counters, and historical avg service of ${avgServiceTime}m.`;
  if (peopleAhead === 0) {
    explanation = 'Counters are currently available with near zero wait time.';
  }

  return {
    estimatedWaitMinutes,
    peopleAhead,
    activeCounters,
    averageServiceTimeMinutes: avgServiceTime,
    queueVelocity,
    confidenceScore,
    explanation
  };
}

/**
 * Automatically updates queue positions and wait times for all waiting tokens in a branch
 */
export async function updateWaitingTimes(branchId: string): Promise<void> {
  try {
    const waitingTokens = await TokenModel.find({ branchId, status: 'WAITING' });
    
    // Sort by priority first (EMERGENCY -> PRIORITY -> NORMAL) then by createdAt
    const priorityWeights: Record<string, number> = {
      EMERGENCY: 0,
      PRIORITY: 1,
      NORMAL: 2
    };

    waitingTokens.sort((a: any, b: any) => {
      const weightA = priorityWeights[a.priority] ?? 2;
      const weightB = priorityWeights[b.priority] ?? 2;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const activeCounters = await getActiveCounterCount(branchId);

    for (let i = 0; i < waitingTokens.length; i++) {
      const token = waitingTokens[i];
      const position = i + 1;
      const avgServiceTime = await calculateAverageServiceTime(token.serviceId, branchId);
      const peopleAhead = Math.max(0, position - 1);
      
      let waitMinutes = (peopleAhead * avgServiceTime) / activeCounters;
      if (token.priority === 'EMERGENCY') {
        waitMinutes = 1;
      } else if (token.priority === 'PRIORITY') {
        waitMinutes = Math.max(2, waitMinutes * 0.7);
      }

      await TokenModel.findByIdAndUpdate(token._id, {
        queuePosition: position,
        estimatedWaitTime: Math.max(1, Math.round(waitMinutes))
      });
    }
  } catch (err) {
    console.error('Error updating waiting times:', err);
  }
}
