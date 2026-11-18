import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  getBranchQueueStatus,
  callNextToken,
  startService,
  completeService,
  skipToken,
  recallToken,
  verifyAndScanToken
} from '../services/queueService';
import { getQueuePrediction } from '../services/predictionService';
import { CounterModel } from '../models/Counter';

export async function getQueueByBranch(req: Request, res: Response) {
  try {
    const { branchId } = req.params;
    const status = await getBranchQueueStatus(branchId);
    return res.json({ success: true, ...status });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQueueStatus(req: Request, res: Response) {
  try {
    const { branchId } = req.params;
    const status = await getBranchQueueStatus(branchId);

    // Extract NOW SERVING, NEXT, and WAITING array for digital board display
    const nowServing = status.serving[0] || status.called[0] || null;
    const nextInLine = status.waiting[0] || null;
    const waitingTokens = status.waiting.slice(0, 10).map((t: any) => t.tokenNumber);

    return res.json({
      success: true,
      nowServing: nowServing ? nowServing.tokenNumber : '--',
      next: nextInLine ? nextInLine.tokenNumber : '--',
      waiting: waitingTokens,
      totalWaiting: status.totalWaiting,
      activeCounters: status.activeCounters,
      servingList: status.serving,
      calledList: status.called
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQueuePredictionHandler(req: Request, res: Response) {
  try {
    const { branchId } = req.params;
    const { serviceId } = req.query;
    const prediction = await getQueuePrediction(branchId, serviceId as string | undefined);
    return res.json({ success: true, prediction });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function callNextHandler(req: AuthRequest, res: Response) {
  try {
    const { branchId, counterId } = req.body;
    const staffId = req.user._id;

    if (!branchId || !counterId) {
      return res.status(400).json({ success: false, message: 'branchId and counterId are required.' });
    }

    const token = await callNextToken({
      branchId,
      counterId,
      staffId
    });

    return res.json({ success: true, message: `Token ${token.tokenNumber} called.`, token });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function startServiceHandler(req: AuthRequest, res: Response) {
  try {
    const { tokenId } = req.params;
    const staffId = req.user._id;

    const token = await startService(tokenId, staffId);
    return res.json({ success: true, message: `Service started for ${token.tokenNumber}.`, token });
  } catch (error: any) {
    const statusCode = error.code === 'TOKEN_VERIFICATION_REQUIRED' ? 403 : 400;
    return res.status(statusCode).json({
      success: false,
      code: error.code || 'SERVE_ERROR',
      message: error.message || "Please verify the customer's token before serving."
    });
  }
}

export async function completeServiceHandler(req: AuthRequest, res: Response) {
  try {
    const { tokenId } = req.params;
    const { serviceRemarks, staffRemarks } = req.body;
    const remarks = serviceRemarks !== undefined ? serviceRemarks : staffRemarks;
    const staffId = req.user._id;

    const token: any = await completeService(tokenId, staffId, remarks);
    const emailResult = token?.emailResult;

    return res.json({
      success: true,
      message: `Token ${token.tokenNumber} completed.`,
      token,
      staffRemarks: token.staffRemarks || remarks || '',
      serviceRemarks: token.staffRemarks || remarks || '',
      emailSent: emailResult?.success === true,
      emailStatus: emailResult?.success
        ? 'Email delivered to customer'
        : (emailResult?.reason || 'Email not sent (SMTP not configured)')
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function skipTokenHandler(req: AuthRequest, res: Response) {
  try {
    const { tokenId } = req.params;
    const { reason } = req.body;
    const staffId = req.user?._id;

    const token = await skipToken(tokenId, reason, staffId);
    return res.json({ success: true, message: `Token ${token.tokenNumber} skipped.`, token });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function recallTokenHandler(req: AuthRequest, res: Response) {
  try {
    const { tokenId } = req.params;
    const { counterId } = req.body;

    if (!counterId) {
      return res.status(400).json({ success: false, message: 'counterId is required.' });
    }

    const token = await recallToken(tokenId, counterId);
    return res.json({ success: true, message: `Token ${token.tokenNumber} recalled.`, token });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function scanQRHandler(req: AuthRequest, res: Response) {
  try {
    const { qrTokenId, qrData, tokenId, tokenNumber, branchId } = req.body;
    let extractedQrId: string | undefined = qrTokenId;
    let manualTokenNumber: string | undefined = tokenNumber;

    if (!extractedQrId && qrData) {
      if (typeof qrData === 'object') {
        extractedQrId = qrData.qrTokenId;
        if (!manualTokenNumber && qrData.tokenNumber) manualTokenNumber = qrData.tokenNumber;
      } else if (typeof qrData === 'string') {
        const trimmed = qrData.trim();
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            if (parsed.qrTokenId) extractedQrId = parsed.qrTokenId;
            if (parsed.tokenNumber) manualTokenNumber = parsed.tokenNumber;
          } else {
            extractedQrId = trimmed;
          }
        } catch {
          extractedQrId = trimmed;
        }
      }
    }

    if (!extractedQrId && !tokenId && !manualTokenNumber) {
      return res.status(400).json({ valid: false, success: false, message: 'INVALID TOKEN – Please scan again.' });
    }

    const result = await verifyAndScanToken({
      qrTokenId: extractedQrId,
      tokenId,
      tokenNumber: manualTokenNumber,
      branchId: branchId || req.user?.branchId,
      staffBranchId: req.user?.branchId,
      staffId: req.user?._id
    });

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        success: false,
        status: (result as any).status,
        message: result.message
      });
    }

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    return res.status(400).json({ valid: false, success: false, message: error.message || 'INVALID TOKEN – Please scan again.' });
  }
}
