import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, departmentsApi } from '../api';
import { getErrorMessage } from '../api/client';
import Modal from '../components/Modal';
import type { CreateUserInput, User, UserRole } from '../types';

interface EditUserForm {
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
}

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [createForm, setCreateForm] = useState<CreateUserInput>({
    name: '', email: '', password: '', role: 'department_user', departmentId: '',
  });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ name: '', email: '', role: 'department_user', departmentId: '' });
  const [editError, setEditError] = useState('');

  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetForm, setResetForm] = useState<ResetPasswordForm>({ newPassword: '', confirmPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: authApi.getUsers });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.getAll });
  const activeDepartments = departmentsQuery.data?.filter((d) => d.isActive) || [];

  const createMutation = useMutation({
    mutationFn: authApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateForm({ name: '', email: '', password: '', role: 'department_user', departmentId: '' });
      setCreateSuccess('User created successfully');
      setCreateError('');
      setTimeout(() => setCreateSuccess(''), 3000);
    },
  });

  // FIX #6: edit user mutation — calls PUT /auth/users/:id (we'll add this endpoint)
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EditUserForm> }) =>
      authApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  // FIX #1: admin reset password mutation
  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      authApi.adminResetPassword(id, password),
    onSuccess: () => {
      setResetSuccess(true);
      setTimeout(() => { setResetUser(null); setResetSuccess(false); }, 1500);
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    try {
      await createMutation.mutateAsync({
        ...createForm,
        departmentId: createForm.role === 'department_user' ? createForm.departmentId : null,
      });
    } catch (err) {
      setCreateError(getErrorMessage(err));
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || '',
    });
    setEditError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      await editMutation.mutateAsync({
        id: editingUser!.id,
        data: {
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          departmentId: editForm.role === 'department_user' ? editForm.departmentId : '',
        },
      });
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    if (resetForm.newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    try {
      await resetMutation.mutateAsync({ id: resetUser!.id, password: resetForm.newPassword });
    } catch (err) {
      setResetError(getErrorMessage(err));
    }
  };

  // FIX #7: role badge styles
  const roleBadge = (role: UserRole) =>
    role === 'admin'
      ? 'bg-navy text-white'
      : 'bg-blue-100 text-blue-800';

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl">Users</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage department users</p>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-navy sm:text-lg">Create User</h2>
        {createError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{createError}</div>}
        {createSuccess && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{createSuccess}</div>}

        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input type="text" required value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required minLength={6} value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole, departmentId: '' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy">
              <option value="department_user">Department User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {createForm.role === 'department_user' && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
              <select required value={createForm.departmentId || ''}
                onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy">
                <option value="">Select department</option>
                {activeDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={createMutation.isPending}
              className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-50 sm:w-auto">
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* Users list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-navy sm:text-lg">
            All Users
            {usersQuery.data && (
              <span className="ml-2 text-sm font-normal text-gray-500">({usersQuery.data.length})</span>
            )}
          </h2>
        </div>

        {usersQuery.isLoading ? (
          <div className="space-y-3 p-6">
            {[1,2,3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : usersQuery.isError ? (
          <p className="p-6 text-red-600">Failed to load users.</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-sm sm:table">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersQuery.data?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${roleBadge(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.department?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(user)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
                        <button onClick={() => { setResetUser(user); setResetForm({ newPassword: '', confirmPassword: '' }); setResetError(''); setResetSuccess(false); }}
                          className="text-xs font-medium text-amber-600 hover:text-amber-800">Reset Password</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {usersQuery.data?.map((user) => (
                <div key={user.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${roleBadge(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  {user.department && (
                    <p className="mt-1 text-xs text-gray-500">Dept: {user.department.name}</p>
                  )}
                  <div className="mt-2 flex gap-3">
                    <button onClick={() => openEdit(user)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
                    <button onClick={() => { setResetUser(user); setResetForm({ newPassword: '', confirmPassword: '' }); setResetError(''); setResetSuccess(false); }}
                      className="text-xs font-medium text-amber-600 hover:text-amber-800">Reset Password</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal title={`Edit — ${editingUser.name}`} onClose={() => setEditingUser(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            {editError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</div>}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input type="text" required value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
              <select value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole, departmentId: '' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy">
                <option value="department_user">Department User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {editForm.role === 'department_user' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
                <select required value={editForm.departmentId || ''}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy">
                  <option value="">Select department</option>
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditingUser(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={editMutation.isPending}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-50">
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <Modal title={`Reset Password — ${resetUser.name}`} onClose={() => setResetUser(null)}>
          {resetSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
              <p className="font-medium text-green-700">Password reset successfully</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {resetError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{resetError}</div>}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
                <input type="password" required minLength={6} value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
                <input type="password" required minLength={6} value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setResetUser(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={resetMutation.isPending}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                  {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
