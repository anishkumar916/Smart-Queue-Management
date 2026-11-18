import crypto from 'crypto';
import { TokenModel, IToken } from '../models/Token';
import { QueueSettingsModel } from '../models/QueueSettings';
import { ServiceModel } from '../models/Service';
import { calculateEstimatedWaitTime, updateWaitingTimes } from './predictionService';
import { createNotification } from './notificationService';

export async function generateTokenNumber(branchId: string, serviceId: string): Promise<string> {
  const service = await ServiceModel.findById(serviceId);
  const settings = await QueueSettingsModel.findOne({ branchId });

  // Prefix based on service name first letter, or settings tokenPrefix
  let prefix = 'A';
  if (service && service.name) {
    prefix = service.name.trim().charAt(0).toUpperCase();
  } else if (settings && settings.tokenPrefix) {
    prefix = settings.tokenPrefix.toUpperCase();
  }

  // Count existing tokens for this branch today
  const today = new Date().toISOString().split('T')[0];
  const allTokens = await TokenModel.find({ branchId });
  const todaysTokens = allTokens.filter((t: any) => t.createdAt.startsWith(today));

  // Determine next number
  const nextSeq = todaysTokens.length + 1;
  const formattedSeq = String(nextSeq).padStart(3, '0');

  return `${prefix}${formattedSeq}`;
}

export async function createToken(params: {
  customerId: string;
  branchId: string;
  serviceId: string;
  priority?: 'NORMAL' | 'PRIORITY' | 'EMERGENCY';
}): Promise<IToken> {
  const { customerId, branchId, serviceId, priority = 'NORMAL' } = params;

  // Check if customer already has an active token in this branch
  const existing = await TokenModel.findOne({
    customerId,
    branchId,
    status: { $in: ['WAITING', 'CALLED', 'SERVING'] }
  });

  if (existing) {
    throw new Error(`You already have an active token (${existing.tokenNumber}) in this queue.`);
  }

  // Check max queue size setting
  const settings = await QueueSettingsModel.findOne({ branchId });
  const activeCount = await TokenModel.countDocuments({
    branchId,
    status: { $in: ['WAITING', 'CALLED', 'SERVING'] }
  });

  if (settings && settings.maxQueueSize && activeCount >= settings.maxQueueSize) {
    throw new Error('This queue has reached its maximum capacity for today. Please try again later.');
  }

  const tokenNumber = await generateTokenNumber(branchId, serviceId);

  // Position is waiting tokens count + 1
  const waitingCount = await TokenModel.countDocuments({ branchId, status: 'WAITING' });
  const queuePosition = waitingCount + 1;

  const estimatedWaitTime = await calculateEstimatedWaitTime({
    branchId,
    serviceId,
    queuePosition,
    priority
  });

  const qrTokenId = crypto.randomUUID();

  const token = await TokenModel.create({
    tokenNumber,
    customerId,
    branchId,
    serviceId,
    qrTokenId,
    status: 'WAITING',
    priority,
    queuePosition,
    estimatedWaitTime,
    createdAt: new Date().toISOString()
  });

  // Re-calculate waiting times dynamically
  await updateWaitingTimes(branchId);

  // Send notification to customer
  await createNotification({
    userId: customerId,
    type: 'TOKEN_CREATED',
    title: `Token ${tokenNumber} Issued`,
    message: `Your token ${tokenNumber} has been generated. Queue position: ${queuePosition}. Estimated wait: ${estimatedWaitTime} min.`
  });

  return token;
}
