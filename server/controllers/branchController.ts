import { Request, Response } from 'express';
import { BranchModel } from '../models/Branch';
import { ServiceModel } from '../models/Service';
import { CounterModel } from '../models/Counter';

export async function getBranches(req: Request, res: Response) {
  try {
    const { organizationId } = req.query;
    const query: any = { isActive: true };
    if (organizationId) query.organizationId = organizationId;

    const list = await BranchModel.find(query);
    return res.json({ success: true, branches: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getBranchById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const branch = await BranchModel.findById(id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });

    const services = await ServiceModel.find({ branchId: id, isActive: true });
    const counters = await CounterModel.find({ branchId: id });

    return res.json({
      success: true,
      branch: {
        ...branch,
        services,
        counters
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createBranch(req: Request, res: Response) {
  try {
    const { organizationId, name, address, openingTime, closingTime } = req.body;
    if (!organizationId || !name) {
      return res.status(400).json({ success: false, message: 'organizationId and name are required' });
    }

    const branch = await BranchModel.create({
      organizationId,
      name,
      address: address || '',
      openingTime: openingTime || '09:00',
      closingTime: closingTime || '17:00',
      isActive: true
    });

    return res.status(201).json({ success: true, branch });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateBranch(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const branch = await BranchModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    return res.json({ success: true, branch });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteBranch(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await BranchModel.findByIdAndUpdate(id, { isActive: false });
    return res.json({ success: true, message: 'Branch deactivated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
