import { Request, Response } from 'express';
import { OrganizationModel } from '../models/Organization';
import { BranchModel } from '../models/Branch';

export async function getOrganizations(req: Request, res: Response) {
  try {
    const list = await OrganizationModel.find({ isActive: true });
    return res.json({ success: true, organizations: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createOrganization(req: Request, res: Response) {
  try {
    const { name, description, address, phone, email } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const org = await OrganizationModel.create({
      name,
      description: description || '',
      address: address || '',
      phone: phone || '',
      email: email || '',
      isActive: true
    });

    return res.status(201).json({ success: true, organization: org });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateOrganization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const org = await OrganizationModel.findByIdAndUpdate(id, req.body, { new: true });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    return res.json({ success: true, organization: org });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteOrganization(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await OrganizationModel.findByIdAndUpdate(id, { isActive: false });
    return res.json({ success: true, message: 'Organization deactivated' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
