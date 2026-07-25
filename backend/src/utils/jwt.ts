import jwt from 'jsonwebtoken';
import { AuthUser, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser & { id: string } {
  const payload = jwt.verify(token, JWT_SECRET) as {
    id: string;
    email: string;
    role: UserRole;
    departmentId: string | null;
  };

  return {
    id: payload.id,
    name: '',
    email: payload.email,
    role: payload.role,
    departmentId: payload.departmentId,
  };
}
