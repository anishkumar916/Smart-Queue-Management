import { TokenModel } from '../models/Token';
import { CounterModel } from '../models/Counter';
import { ServiceModel } from '../models/Service';
import { ServiceHistoryModel } from '../models/ServiceHistory';
import { UserModel } from '../models/User';
import { BranchModel } from '../models/Branch';
import { updateWaitingTimes } from './predictionService';
import { createNotification } from './notificationService';
import {
  broadcastQueueUpdate,
  emitTokenCalled,
  emitServiceStarted,
  emitServiceCompleted,
  emitTokenSkipped
} from './socketService';
import {
  checkAndSendQueueEmailAlerts,
  sendServiceCompletedEmailAlert
} from './emailService';

export async function getBranchQueueStatus(branchId: string) {
  const tokens = await TokenModel.find({ branchId });
  const counters = await CounterModel.find({ branchId });
  const services = await ServiceModel.find({ branchId });

  const waiting = tokens
    .filter((t: any) => t.status === 'WAITING' || t.status === 'TOKEN_PRESENTED' || t.status === 'VERIFIED')
    .sort((a: any, b: any) => (a.queuePosition || 0) - (b.queuePosition || 0));

  const called = tokens.filter((t: any) => t.status === 'CALLED');
  const serving = tokens.filter((t: any) => t.status === 'SERVING');
  const completedToday = tokens.filter((t: any) => t.status === 'COMPLETED');

  // Currently serving tokens with counter info
  const servingList = serving.map((t: any) => {
    const counter = counters.find((c: any) => c._id === t.counterId || c.counterNumber === t.counterId);
    const service = services.find((s: any) => s._id === t.serviceId);
    return {
      ...t,
      counterName: counter ? counter.name : `Counter ${t.counterId || 1}`,
      serviceName: service ? service.name : 'General Service'
    };
  });

  const calledList = called.map((t: any) => {
    const counter = counters.find((c: any) => c._id === t.counterId || c.counterNumber === t.counterId);
    const service = services.find((s: any) => s._id === t.serviceId);
    return {
      ...t,
      counterName: counter ? counter.name : `Counter ${t.counterId || 1}`,
      serviceName: service ? service.name : 'General Service'
    };
  });

  return {
    branchId,
    waiting,
    called: calledList,
    serving: servingList,
    completedCount: completedToday.length,
    activeCounters: counters.filter((c: any) => c.isActive).length,
    totalWaiting: waiting.length
  };
}

export async function callNextToken(params: {
  branchId: string;
  counterId: string;
  staffId: string;
}) {
  const { branchId, counterId, staffId } = params;

  // Find next waiting token (sorted by priority & position)
  const waitingTokens = await TokenModel.find({ branchId, status: 'WAITING' });
  if (!waitingTokens || waitingTokens.length === 0) {
    throw new Error('No customers are currently waiting in the queue.');
  }

  // Priority sorting: EMERGENCY -> PRIORITY -> NORMAL, then earliest
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

  const nextToken = waitingTokens[0];

  // Update counter current token
  await CounterModel.findByIdAndUpdate(counterId, {
    currentTokenId: nextToken._id,
    isActive: true,
    assignedStaffId: staffId
  });

  // Update token
  const updatedToken = await TokenModel.findByIdAndUpdate(nextToken._id, {
    status: 'CALLED',
    counterId,
    calledAt: new Date().toISOString()
  });

  // Re-adjust queue positions
  await updateWaitingTimes(branchId);

  // Send alerts
  await createNotification({
    userId: nextToken.customerId,
    type: 'CALLED',
    title: `Token ${nextToken.tokenNumber} Called!`,
    message: `Please proceed to counter now.`
  });

  // Notify approaching customers (next 2 in queue)
  const remainingWaiting = await TokenModel.find({ branchId, status: 'WAITING' });
  for (const token of remainingWaiting.slice(0, 2)) {
    await createNotification({
      userId: token.customerId,
      type: 'APPROACHING',
      title: `Get Ready: ${token.tokenNumber}`,
      message: `Your turn is approaching soon (${token.queuePosition} customer(s) ahead).`
    });
  }

  // Socket broadcast
  emitTokenCalled(branchId, updatedToken);
  const status = await getBranchQueueStatus(branchId);
  broadcastQueueUpdate(branchId, status);

  // Recalculate queue email alerts (Approaching, You are Next)
  await checkAndSendQueueEmailAlerts(branchId);

  return updatedToken;
}

export async function startService(tokenId: string, staffId: string) {
  const token = await TokenModel.findById(tokenId);
  if (!token) throw new Error('Token not found.');

  // Validate that token belongs to the staff member's branch/queue
  const staff = await UserModel.findById(staffId);
  if (staff && staff.branchId && token.branchId !== staff.branchId && staff.role !== 'ADMIN') {
    throw new Error('Unauthorized: Token does not belong to your assigned branch.');
  }

  // Validate that token is in a status that allows starting
  if (token.status === 'SERVING') {
    throw new Error('Service has already started for this token.');
  }
  if (token.status === 'COMPLETED') {
    throw new Error('Cannot serve token: token is already completed.');
  }
  if (token.status === 'CANCELLED') {
    throw new Error('Cannot serve token: token is cancelled.');
  }
  if (token.status === 'SKIPPED') {
    throw new Error('Cannot serve token: token was skipped. Recall first.');
  }

  const now = new Date();
  const created = new Date(token.createdAt);
  const actualWaitTime = Math.max(1, Math.round((now.getTime() - created.getTime()) / (60 * 1000)));

  // Update counter state if architecture requires it
  let counterId = token.counterId;
  if (!counterId) {
    const staffCounter = await CounterModel.findOne({
      branchId: token.branchId,
      assignedStaffId: staffId
    });
    if (staffCounter) {
      counterId = staffCounter._id;
    }
  }

  if (counterId) {
    await CounterModel.findByIdAndUpdate(counterId, {
      currentTokenId: tokenId,
      isServing: true,
      isActive: true,
      assignedStaffId: staffId
    });
  }

  const updatedToken = await TokenModel.findByIdAndUpdate(tokenId, {
    status: 'SERVING',
    isVerified: true,
    serviceStartedAt: now.toISOString(),
    actualWaitTime,
    ...(counterId ? { counterId } : {})
  });

  await createNotification({
    userId: token.customerId,
    type: 'SERVING',
    title: `Service Started: ${token.tokenNumber}`,
    message: `Your service is now in progress.`
  });

  emitServiceStarted(token.branchId, updatedToken);
  const status = await getBranchQueueStatus(token.branchId);
  broadcastQueueUpdate(token.branchId, status);

  return updatedToken;
}

export async function completeService(tokenId: string, staffId: string, serviceRemarks?: string) {
  const token = await TokenModel.findById(tokenId);
  if (!token) throw new Error('Token not found.');

  if (token.status === 'COMPLETED') {
    throw new Error('Service has already been completed for this token.');
  }

  const now = new Date();
  const started = token.serviceStartedAt ? new Date(token.serviceStartedAt) : new Date(token.calledAt || token.createdAt);
  const serviceDuration = Math.max(1, Math.round((now.getTime() - started.getTime()) / (60 * 1000)));

  const updateFields: any = {
    status: 'COMPLETED',
    completedAt: now.toISOString(),
    serviceDuration
  };
  if (typeof serviceRemarks === 'string') {
    updateFields.staffRemarks = serviceRemarks;
  }

  const updatedToken = await TokenModel.findByIdAndUpdate(tokenId, updateFields);

  // Free up counter currentTokenId and reset isServing
  if (token.counterId) {
    await CounterModel.findByIdAndUpdate(token.counterId, {
      currentTokenId: undefined,
      isServing: false
    });
  }

  // Record service history for continuous learning of rolling average
  await ServiceHistoryModel.create({
    tokenId: token._id,
    serviceId: token.serviceId,
    branchId: token.branchId,
    staffId,
    serviceDuration,
    waitingDuration: token.actualWaitTime || 5,
    completedAt: now.toISOString(),
    staffRemarks: serviceRemarks || token.staffRemarks || ''
  });

  // Re-adjust wait times for waiting tokens
  await updateWaitingTimes(token.branchId);

  // Recalculate queue email alerts
  await checkAndSendQueueEmailAlerts(token.branchId);

  // Send completion email alert with saved remarks
  const emailResult = await sendServiceCompletedEmailAlert(token._id, serviceRemarks);

  await createNotification({
    userId: token.customerId,
    type: 'COMPLETED',
    title: `Service Completed: ${token.tokenNumber}`,
    message: `Thank you for visiting! Your service has been completed.`
  });

  emitServiceCompleted(token.branchId, updatedToken);
  const status = await getBranchQueueStatus(token.branchId);
  broadcastQueueUpdate(token.branchId, status);

  if (updatedToken) {
    (updatedToken as any).emailResult = emailResult;
  }
  return updatedToken;
}

export async function skipToken(tokenId: string, reason?: string, staffId?: string) {
  const token = await TokenModel.findById(tokenId);
  if (!token) throw new Error('Token not found.');

  // Validate the token can be skipped
  if (token.status === 'COMPLETED') {
    throw new Error('Cannot skip token: token is already completed.');
  }
  if (token.status === 'CANCELLED') {
    throw new Error('Cannot skip token: token is already cancelled.');
  }
  if (token.status === 'SKIPPED') {
    throw new Error('Cannot skip token: token is already skipped.');
  }

  const updatedToken = await TokenModel.findByIdAndUpdate(tokenId, {
    status: 'SKIPPED'
  });

  if (token.counterId) {
    await CounterModel.findByIdAndUpdate(token.counterId, {
      currentTokenId: undefined,
      isServing: false
    });
  }

  // Re-adjust wait times for remaining waiting tokens
  await updateWaitingTimes(token.branchId);

  // Recalculate queue email alerts
  await checkAndSendQueueEmailAlerts(token.branchId);

  // Record audit / history event
  await ServiceHistoryModel.create({
    tokenId: token._id,
    serviceId: token.serviceId,
    branchId: token.branchId,
    staffId: staffId || 'staff',
    serviceDuration: 0,
    waitingDuration: token.actualWaitTime || 5,
    completedAt: new Date().toISOString()
  });

  await createNotification({
    userId: token.customerId,
    type: 'SKIPPED',
    title: `Token Skipped: ${token.tokenNumber}`,
    message: `Your token was skipped${reason ? ` (${reason})` : ''}. Please visit the counter to be recalled.`
  });

  emitTokenSkipped(token.branchId, updatedToken);
  const status = await getBranchQueueStatus(token.branchId);
  broadcastQueueUpdate(token.branchId, status);

  return updatedToken;
}

export async function recallToken(tokenId: string, counterId: string) {
  const token = await TokenModel.findById(tokenId);
  if (!token) throw new Error('Token not found.');

  const updatedToken = await TokenModel.findByIdAndUpdate(tokenId, {
    status: 'CALLED',
    counterId,
    calledAt: new Date().toISOString()
  });

  await createNotification({
    userId: token.customerId,
    type: 'CALLED',
    title: `Token Recalled: ${token.tokenNumber}`,
    message: `You have been recalled to the counter.`
  });

  emitTokenCalled(token.branchId, updatedToken);
  const status = await getBranchQueueStatus(token.branchId);
  broadcastQueueUpdate(token.branchId, status);

  return updatedToken;
}

function maskPhone(phone?: string): string {
  if (!phone) return 'Not Provided';
  const clean = phone.trim();
  if (clean.length <= 4) return '***';
  return clean.slice(0, 3) + '***' + clean.slice(-4);
}

export async function verifyAndScanToken(params: {
  qrTokenId?: string;
  tokenId?: string;
  tokenNumber?: string;
  branchId?: string;
  staffBranchId?: string;
  staffId?: string;
}) {
  const { qrTokenId, tokenId, tokenNumber, branchId, staffBranchId, staffId } = params;
  const targetBranchId = branchId || staffBranchId;

  let token: any = null;

  // 1. Search primarily by unique qrTokenId
  if (qrTokenId) {
    token = await TokenModel.findOne({ qrTokenId: qrTokenId.trim() });
    // Also support manual input of tokenNumber or ID if entered in QR search
    if (!token && qrTokenId.trim()) {
      token = await TokenModel.findOne({ tokenNumber: qrTokenId.trim().toUpperCase() });
    }
  } else if (tokenId) {
    token = await TokenModel.findById(tokenId);
  } else if (tokenNumber) {
    if (targetBranchId) {
      token = await TokenModel.findOne({ tokenNumber: tokenNumber.trim().toUpperCase(), branchId: targetBranchId });
    }
    if (!token) {
      token = await TokenModel.findOne({ tokenNumber: tokenNumber.trim().toUpperCase() });
    }
  }

  // If not found in database: REJECT with INVALID TOKEN
  if (!token) {
    return {
      valid: false,
      message: 'INVALID TOKEN'
    };
  }

  // 2. Validate branch authorization
  if (targetBranchId && token.branchId !== targetBranchId) {
    return {
      valid: false,
      message: 'INVALID QUEUE'
    };
  }

  // 3. Status validation
  if (token.status === 'COMPLETED') {
    return {
      valid: false,
      status: 'COMPLETED',
      message: 'TOKEN ALREADY COMPLETED'
    };
  }

  if (token.status === 'CANCELLED') {
    return {
      valid: false,
      status: 'CANCELLED',
      message: 'TOKEN CANCELLED'
    };
  }

  if (token.status === 'SKIPPED') {
    return {
      valid: false,
      status: 'SKIPPED',
      message: 'TOKEN SKIPPED – Recall to counter first'
    };
  }

  // 4. Mark token as verified in database (Backend is final authority)
  const updatedToken = await TokenModel.findByIdAndUpdate(token._id, {
    isVerified: true,
    status: 'VERIFIED',
    verifiedAt: new Date().toISOString(),
    verifiedByStaffId: staffId
  });

  // Fetch customer & service details (safely sanitized)
  const customer = await UserModel.findById(token.customerId);
  const service = await ServiceModel.findById(token.serviceId);
  const branch = await BranchModel.findById(token.branchId);

  const safeCustomer = {
    name: customer?.name || 'Registered Customer',
    phone: maskPhone(customer?.phone)
  };

  const safeToken = {
    _id: updatedToken._id,
    tokenNumber: updatedToken.tokenNumber,
    status: 'VERIFIED',
    isVerified: true,
    priority: updatedToken.priority,
    estimatedWaitTime: updatedToken.estimatedWaitTime,
    queuePosition: updatedToken.queuePosition,
    branchId: updatedToken.branchId,
    serviceId: updatedToken.serviceId,
    counterId: updatedToken.counterId
  };

  // Broadcast verification update
  const status = await getBranchQueueStatus(token.branchId);
  broadcastQueueUpdate(token.branchId, status);

  return {
    valid: true,
    canProcess: true,
    message: '✓ TOKEN VERIFIED',
    verification: '✓ VALID',
    status: 'VERIFIED',
    token: safeToken,
    customer: safeCustomer,
    service: {
      name: service?.name || 'Standard Service'
    },
    branch: {
      name: branch?.name || 'Main Queue'
    }
  };
}
