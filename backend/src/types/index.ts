export type UserRole = 'admin' | 'department_user';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStoredStatus = 'ongoing' | 'completed';
export type DisplayStatus = 'completed' | 'ongoing' | 'overdue';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
