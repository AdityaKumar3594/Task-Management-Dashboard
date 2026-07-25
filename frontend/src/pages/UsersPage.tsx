import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, departmentsApi } from '../api';
import { getErrorMessage } from '../api/client';
import type { CreateUserInput, UserRole } from '../types';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateUserInput>({
    name: '',
    email: '',
    password: '',
    role: 'department_user',
    departmentId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getUsers,
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: authApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setForm({ name: '', email: '', password: '', role: 'department_user', departmentId: '' });
      setSuccess('User created successfully');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload: CreateUserInput = {
      ...form,
      departmentId: form.role === 'department_user' ? form.departmentId : null,
    };

    try {
      await createMutation.mutateAsync(payload);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const activeDepartments = departmentsQuery.data?.filter((d) => d.isActive) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Users</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage department users</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-navy">Create User</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as UserRole, departmentId: '' })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value="department_user">Department User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {form.role === 'department_user' && (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Department</label>
              <select
                required
                value={form.departmentId || ''}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              >
                <option value="">Select department</option>
                {activeDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-navy">
            All Users
            {usersQuery.data && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({usersQuery.data.length})
              </span>
            )}
          </h2>
        </div>
        {usersQuery.isLoading ? (
          <p className="p-6 text-gray-500">Loading users...</p>
        ) : usersQuery.isError ? (
          <p className="p-6 text-red-600">Failed to load users.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersQuery.data?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {user.role.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.department?.name || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
