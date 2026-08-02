import { api } from './client';
import type {
  CreateDepartmentInput,
  CreateTaskInput,
  CreateUserInput,
  DashboardSummary,
  Department,
  DepartmentBreakdown,
  LoginResponse,
  Task,
  User,
} from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  getUsers: () => api.get<User[]>('/auth/users').then((r) => r.data),
  createUser: (data: CreateUserInput) => api.post<User>('/auth/users', data).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
  adminResetPassword: (userId: string, newPassword: string) =>
    api.patch(`/auth/users/${userId}/reset-password`, { newPassword }).then((r) => r.data),
};

export const departmentsApi = {
  getAll: () => api.get<Department[]>('/departments').then((r) => r.data),
  create: (data: CreateDepartmentInput) =>
    api.post<Department>('/departments', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateDepartmentInput & { isActive: boolean }>) =>
    api.put<Department>(`/departments/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/departments/${id}`).then((r) => r.data),
};

export const tasksApi = {
  getAll: (params?: { departmentId?: string; status?: string; priority?: string }) =>
    api.get<Task[]>('/tasks', { params }).then((r) => r.data),
  create: (data: CreateTaskInput) => api.post<Task>('/tasks', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateTaskInput & { status: string }>) =>
    api.put<Task>(`/tasks/${id}`, data).then((r) => r.data),
  complete: (id: string) => api.patch<Task>(`/tasks/${id}/complete`).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),
  getDepartmentUsers: (departmentId: string) =>
    api.get<{ id: string; name: string; email: string }[]>(`/tasks/department-users/${departmentId}`).then((r) => r.data),
};

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
  getByDepartment: () =>
    api.get<DepartmentBreakdown[]>('/dashboard/by-department').then((r) => r.data),
};
