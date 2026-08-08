import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { verifyToken } from '../utils/jwt';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId.toString() : null,
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Officers are read-only — block any write operation for them
export function requireWriteAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (req.user.role === 'officer') {
    return res.status(403).json({ message: 'Officers have read-only access and cannot perform this action' });
  }
  next();
}

export function canAccessDepartment(req: Request, departmentId: string): boolean {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  if (req.user.role === 'officer') return false;
  if (!req.user.departmentId) return false;
  return req.user.departmentId === departmentId;
}
