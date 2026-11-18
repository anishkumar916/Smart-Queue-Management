import { Request, Response } from 'express';
import { ServiceModel } from '../models/Service';

export async function getServices(req: Request, res: Response) {
  try {
    const { branchId } = req.query;
    const query: any = { isActive: true };
    if (branchId) query.branchId = branchId;

    const list = await ServiceModel.find(query);
    return res.json({ success: true, services: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createService(req: Request, res: Response) {
  try {
    const { branchId, name, description, averageServiceTime = 10, priorityEnabled = true } = req.body;
    if (!branchId || !name) {
      return res.status(400).json({ success: false, message: 'branchId and name are required' });
    }

    const service = await ServiceModel.create({
      branchId,
      name,
      description: description || '',
      averageServiceTime: Number(averageServiceTime) || 10,
      priorityEnabled: Boolean(priorityEnabled),
      isActive: true
    });

    return res.status(201).json({ success: true, service });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const service = await ServiceModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    return res.json({ success: true, service });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await ServiceModel.findByIdAndUpdate(id, { isActive: false });
    return res.json({ success: true, message: 'Service deactivated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
