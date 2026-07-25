export type UserRole = 'admin' | 'department_user';
export type TaskPriority = 'low' | 'medium' | 'high';
export type DisplayStatus = 'completed' | 'ongoing' | 'overdue';

export interface DepartmentRef {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  department?: DepartmentRef | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  department: DepartmentRef | null;
  assignedBy: { id: string; name: string } | null;
  priority: TaskPriority;
  dueDate: string | null;
  status: 'ongoing' | 'completed';
  displayStatus: DisplayStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  total: number;
  completed: number;
  ongoing: number;
  overdue: number;
}

export interface DepartmentBreakdown {
  departmentId: string;
  name: string;
  code: string;
  total: number;
  completed: number;
  ongoing: number;
  overdue: number;
  completionRate: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  departmentId: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
}
