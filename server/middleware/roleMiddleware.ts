import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';

export function authorizeRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user?.role || 'NONE'}' does not have access to this resource`
      });
      return;
    }
    next();
  };
}
