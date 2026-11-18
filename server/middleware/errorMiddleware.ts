import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[API Error]:', err.message || err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`
  });
}
