import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { TokenModel } from '../models/Token';
import { ServiceModel } from '../models/Service';
import { CounterModel } from '../models/Counter';
import { BranchModel } from '../models/Branch';
import { OrganizationModel } from '../models/Organization';
import { ServiceHistoryModel } from '../models/ServiceHistory';
import { QueueSettingsModel } from '../models/QueueSettings';

export async function getAdminDashboard(req: Request, res: Response) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const allTokens = await TokenModel.find();
    const todaysTokens = allTokens.filter((t: any) => t.createdAt.startsWith(today));
    const completedTokens = todaysTokens.filter((t: any) => t.status === 'COMPLETED');
    const waitingTokens = todaysTokens.filter((t: any) => t.status === 'WAITING');
    const activeStaff = await UserModel.countDocuments({ role: 'STAFF', isActive: true });
    const totalCustomers = await UserModel.countDocuments({ role: 'CUSTOMER' });
    const totalServices = await ServiceModel.countDocuments({ isActive: true });
    const totalBranches = await BranchModel.countDocuments({ isActive: true });

    // Calculate average wait time for completed tokens today
    let totalWait = 0;
    completedTokens.forEach((t: any) => {
      totalWait += (t.actualWaitTime || t.estimatedWaitTime || 5);
    });
    const avgWaitTime = completedTokens.length > 0 ? Math.round(totalWait / completedTokens.length) : 8;

    return res.json({
      success: true,
      stats: {
        totalCustomers,
        activeQueues: waitingTokens.length,
        activeStaff,
        totalServices,
        totalBranches,
        tokensToday: todaysTokens.length,
        completedToday: completedTokens.length,
        averageWaitingTime: avgWaitTime
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQueueAnalytics(req: Request, res: Response) {
  try {
    const { branchId, days = 7 } = req.query;
    const query: any = {};
    if (branchId) query.branchId = branchId;

    const tokens = await TokenModel.find(query);
    const services = await ServiceModel.find();
    const counters = await CounterModel.find();
    const histories = await ServiceHistoryModel.find();

    const completed = tokens.filter((t: any) => t.status === 'COMPLETED');
    const cancelled = tokens.filter((t: any) => t.status === 'CANCELLED');
    const skipped = tokens.filter((t: any) => t.status === 'SKIPPED');
    const waiting = tokens.filter((t: any) => t.status === 'WAITING');

    // Hourly distribution for today
    const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const hourlyData = hours.map(hour => {
      const hInt = parseInt(hour.split(':')[0], 10);
      const matched = tokens.filter((t: any) => {
        const d = new Date(t.createdAt);
        return d.getHours() === hInt;
      });
      return {
        hour,
        tokens: matched.length,
        completed: matched.filter((m: any) => m.status === 'COMPLETED').length
      };
    });

    // Peak hour
    let peakHour = '11:00 AM';
    let maxHourCount = -1;
    hourlyData.forEach(h => {
      if (h.tokens > maxHourCount) {
        maxHourCount = h.tokens;
        peakHour = h.hour;
      }
    });

    // Service-wise demand breakdown
    const serviceDemand = services.map((s: any) => {
      const count = tokens.filter((t: any) => t.serviceId === s._id).length;
      return {
        name: s.name,
        tokens: count
      };
    }).filter((s: any) => s.tokens > 0);

    // Counter load breakdown
    const counterLoad = counters.map((c: any) => {
      const count = tokens.filter((t: any) => t.counterId === c._id || t.counterId === c.counterNumber).length;
      return {
        counterNumber: c.counterNumber,
        name: c.name,
        processed: count
      };
    });

    // Average waiting and service duration
    let avgWait = 8;
    let avgService = 7;
    if (histories.length > 0) {
      const sumWait = histories.reduce((acc: number, curr: any) => acc + (curr.waitingDuration || 0), 0);
      const sumServ = histories.reduce((acc: number, curr: any) => acc + (curr.serviceDuration || 0), 0);
      avgWait = Math.round(sumWait / histories.length) || 8;
      avgService = Math.round(sumServ / histories.length) || 7;
    }

    // Dynamic Smart Insights derived from real data
    const insights: string[] = [];
    if (waiting.length > 10) {
      insights.push(`Queue volume is currently high with ${waiting.length} customers in line.`);
    } else if (waiting.length === 0) {
      insights.push('Queues are smoothly cleared with 0 pending waiting customers.');
    } else {
      insights.push(`Queue is operating at normal moderate capacity (${waiting.length} waiting).`);
    }

    insights.push(`Average waiting time across completed tokens is ${avgWait} minutes.`);
    insights.push(`Peak incoming traffic observed around ${peakHour}.`);

    if (serviceDemand.length > 0) {
      const highestDemand = [...serviceDemand].sort((a, b) => b.tokens - a.tokens)[0];
      insights.push(`"${highestDemand.name}" has the highest demand with ${highestDemand.tokens} tokens generated.`);
    }

    if (counterLoad.length > 0) {
      const busiestCounter = [...counterLoad].sort((a, b) => b.processed - a.processed)[0];
      if (busiestCounter && busiestCounter.processed > 0) {
        insights.push(`Counter ${busiestCounter.counterNumber} (${busiestCounter.name}) handled the highest service load.`);
      }
    }

    return res.json({
      success: true,
      analytics: {
        totalTokens: tokens.length,
        completedCount: completed.length,
        cancelledCount: cancelled.length,
        skippedCount: skipped.length,
        waitingCount: waiting.length,
        avgWaitingTime: avgWait,
        avgServiceTime: avgService,
        peakHour,
        hourlyData,
        serviceDemand,
        counterLoad,
        insights
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { role } = req.query;
    const query: any = {};
    if (role) query.role = role;

    const users = await UserModel.find(query);
    const safeUsers = users.map((u: any) => {
      const { password, ...safe } = u;
      return safe;
    });

    return res.json({ success: true, users: safeUsers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, phone, role, isActive, branchId, counterId } = req.body;

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { name, email, phone, role, isActive, branchId, counterId },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    const { password: _, ...safeUser } = updated;
    return res.json({ success: true, user: safeUser });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getQueueSettings(req: Request, res: Response) {
  try {
    const { branchId } = req.params;
    let settings = await QueueSettingsModel.findOne({ branchId });
    if (!settings) {
      settings = await QueueSettingsModel.create({
        branchId,
        maxQueueSize: 100,
        defaultServiceTime: 10,
        priorityEnabled: true,
        notificationEnabled: true,
        tokenPrefix: 'T'
      });
    }
    return res.json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateQueueSettings(req: Request, res: Response) {
  try {
    const { branchId } = req.params;
    const existing = await QueueSettingsModel.findOne({ branchId });

    let updated;
    if (existing) {
      updated = await QueueSettingsModel.findByIdAndUpdate(existing._id, req.body, { new: true });
    } else {
      updated = await QueueSettingsModel.create({ branchId, ...req.body });
    }

    return res.json({ success: true, settings: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
