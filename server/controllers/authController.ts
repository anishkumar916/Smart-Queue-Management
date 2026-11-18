import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { signToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/authMiddleware';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, phone, password, role = 'CUSTOMER', branchId, counterId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password: hashedPassword,
      role: ['CUSTOMER', 'STAFF', 'ADMIN'].includes(role) ? role : 'CUSTOMER',
      isActive: true,
      branchId: branchId || undefined,
      counterId: counterId || undefined
    });

    const token = signToken({
      userId: user._id,
      role: user.role,
      email: user.email
    });

    const userObject = user.toObject();
    const { password: _, ...safeUser } = userObject;
    return res.status(201).json({
      success: true,
      token,
      user: safeUser
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken({
      userId: user._id,
      role: user.role,
      email: user.email
    });

    const userObject = user.toObject();
    const { password: _, ...safeUser } = userObject;
    return res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    return res.json({ success: true, user: req.user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
