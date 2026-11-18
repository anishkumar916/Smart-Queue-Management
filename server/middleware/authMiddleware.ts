import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/generateToken';
import { UserModel } from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    return;
  }

  try {
    const decoded: any = verifyJwt(token);
    const user = await UserModel.findById(decoded.userId);

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User account not found or disabled' });
      return;
    }

    // Do not leak password
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
}
