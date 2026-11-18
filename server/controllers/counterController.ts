import { Request, Response } from 'express';
import { CounterModel } from '../models/Counter';
import { UserModel } from '../models/User';

export async function getCounters(req: Request, res: Response) {
  try {
    const { branchId } = req.query;
    const query: any = {};
    if (branchId) query.branchId = branchId;

    const list = await CounterModel.find(query);
    const enriched = await Promise.all(
      list.map(async (c: any) => {
        let staffName = '';
        if (c.assignedStaffId) {
          const staff = await UserModel.findById(c.assignedStaffId);
          staffName = staff?.name || '';
        }
        return {
          ...c,
          staffName
        };
      })
    );

    return res.json({ success: true, counters: enriched });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createCounter(req: Request, res: Response) {
  try {
    const { branchId, counterNumber, name, assignedStaffId } = req.body;
    if (!branchId || !counterNumber || !name) {
      return res.status(400).json({ success: false, message: 'branchId, counterNumber, and name are required' });
    }

    const counter = await CounterModel.create({
      branchId,
      counterNumber,
      name,
      assignedStaffId: assignedStaffId || undefined,
      isActive: true
    });

    return res.status(201).json({ success: true, counter });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCounter(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const counter = await CounterModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!counter) return res.status(404).json({ success: false, message: 'Counter not found' });
    return res.json({ success: true, counter });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleCounterActive(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const current = await CounterModel.findById(id);
    if (!current) return res.status(404).json({ success: false, message: 'Counter not found' });

    const counter = await CounterModel.findByIdAndUpdate(id, { isActive: !current.isActive }, { new: true });
    return res.json({ success: true, counter });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
