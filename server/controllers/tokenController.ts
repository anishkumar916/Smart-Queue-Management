import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { TokenModel } from '../models/Token';
import { BranchModel } from '../models/Branch';
import { ServiceModel } from '../models/Service';
import { CounterModel } from '../models/Counter';
import { createToken } from '../services/tokenService';
import { updateWaitingTimes } from '../services/predictionService';
import { broadcastQueueUpdate } from '../services/socketService';
import { getBranchQueueStatus } from '../services/queueService';
import { createNotification } from '../services/notificationService';
import { checkAndSendQueueEmailAlerts } from '../services/emailService';

export async function joinQueue(req: AuthRequest, res: Response) {
  try {
    const { branchId, serviceId, priority } = req.body;
    const customerId = req.user._id;

    if (!branchId || !serviceId) {
      return res.status(400).json({ success: false, message: 'branchId and serviceId are required.' });
    }

    // Role check for priority: Only staff/admin can set EMERGENCY or PRIORITY directly, customers default to NORMAL
    let assignedPriority = 'NORMAL';
    if (['STAFF', 'ADMIN'].includes(req.user.role) && priority) {
      assignedPriority = priority;
    }

    const token = await createToken({
      customerId,
      branchId,
      serviceId,
      priority: assignedPriority as any
    });

    const status = await getBranchQueueStatus(branchId);
    broadcastQueueUpdate(branchId, status);

    return res.status(201).json({
      success: true,
      token
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function getMyTokens(req: AuthRequest, res: Response) {
  try {
    const customerId = req.user._id;
    const all = await TokenModel.find({ customerId });

    // Populate branch and service names
    const enriched = await Promise.all(
      all.map(async (t: any) => {
        const branch = await BranchModel.findById(t.branchId);
        const service = await ServiceModel.findById(t.serviceId);
        const counter = t.counterId ? await CounterModel.findById(t.counterId) : null;
        return {
          ...t,
          branchName: branch?.name || 'Main Branch',
          serviceName: service?.name || 'General Service',
          counterName: counter?.name || (t.counterId ? `Counter ${t.counterId}` : undefined)
        };
      })
    );

    // Sort active tokens first, then newest
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const active = enriched.filter(t => ['WAITING', 'CALLED', 'SERVING'].includes(t.status));
    const history = enriched.filter(t => !['WAITING', 'CALLED', 'SERVING'].includes(t.status));

    return res.json({
      success: true,
      activeToken: active[0] || null,
      activeTokens: active,
      tokens: enriched,
      history
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTokenById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const token = await TokenModel.findById(id);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    const branch = await BranchModel.findById(token.branchId);
    const service = await ServiceModel.findById(token.serviceId);
    const counter = token.counterId ? await CounterModel.findById(token.counterId) : null;

    // Get current serving token in this branch
    const serving = await TokenModel.findOne({ branchId: token.branchId, status: 'SERVING' });

    return res.json({
      success: true,
      token: {
        ...token,
        branchName: branch?.name || 'Branch',
        serviceName: service?.name || 'Service',
        counterName: counter?.name || (token.counterId ? `Counter ${token.counterId}` : undefined),
        currentServingTokenNumber: serving?.tokenNumber || 'None'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function trackPublicToken(req: Request, res: Response) {
  try {
    const { tokenNumber } = req.params;
    if (!tokenNumber) {
      return res.status(400).json({ success: false, message: 'Token number is required.' });
    }

    const list = await TokenModel.find({ tokenNumber: tokenNumber.toUpperCase().trim() });
    if (!list || list.length === 0) {
      return res.status(404).json({ success: false, message: `Token ${tokenNumber.toUpperCase()} not found.` });
    }

    // Pick active or latest
    const token = list.find((t: any) => ['WAITING', 'CALLED', 'SERVING'].includes(t.status)) || list[list.length - 1];

    const branch = await BranchModel.findById(token.branchId);
    const service = await ServiceModel.findById(token.serviceId);
    const counter = token.counterId ? await CounterModel.findById(token.counterId) : null;

    // Find current serving token in branch
    const serving = await TokenModel.findOne({ branchId: token.branchId, status: 'SERVING' });
    const called = await TokenModel.findOne({ branchId: token.branchId, status: 'CALLED' });

    // Calculate people ahead
    const waitingTokens = await TokenModel.find({ branchId: token.branchId, status: 'WAITING' });
    const myPos = token.queuePosition || 1;
    const peopleAhead = Math.max(0, myPos - 1);

    return res.json({
      success: true,
      token: {
        _id: token._id,
        tokenNumber: token.tokenNumber,
        status: token.status,
        queuePosition: token.queuePosition,
        estimatedWaitTime: token.estimatedWaitTime,
        priority: token.priority,
        branchName: branch?.name || 'Branch',
        serviceName: service?.name || 'Service',
        counterName: counter?.name || (token.counterId ? `Counter ${token.counterId}` : null),
        peopleAhead,
        currentServingToken: serving?.tokenNumber || called?.tokenNumber || 'None',
        createdAt: token.createdAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function cancelToken(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const token = await TokenModel.findById(id);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    // Validate ownership or admin/staff
    if (token.customerId !== req.user._id && !['ADMIN', 'STAFF'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this token.' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(token.status)) {
      return res.status(400).json({ success: false, message: `Token is already ${token.status.toLowerCase()}.` });
    }

    const updated = await TokenModel.findByIdAndUpdate(id, {
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString()
    });

    await updateWaitingTimes(token.branchId);
    await checkAndSendQueueEmailAlerts(token.branchId);

    await createNotification({
      userId: token.customerId,
      type: 'CANCELLED',
      title: `Token ${token.tokenNumber} Cancelled`,
      message: 'Your token was cancelled.'
    });

    const status = await getBranchQueueStatus(token.branchId);
    broadcastQueueUpdate(token.branchId, status);

    return res.json({
      success: true,
      message: 'Token cancelled successfully.',
      token: updated
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
