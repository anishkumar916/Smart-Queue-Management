import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_queue_secret_dev_key_2026_xyz';

export function signToken(payload: { userId: string; role: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d'
  });
}

export function verifyJwt(tokenString: string): any {
  return jwt.verify(tokenString, JWT_SECRET);
}
