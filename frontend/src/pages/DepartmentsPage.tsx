import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../api';
import { getErrorMessage } from '../api/client';
import Modal from '../components/Modal';
import type { CreateDepartmentInput, Department } from '../types';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form, setForm] = useState<CreateDepartmentInput>({ name: '', code: '', description: '' });
  const [error, setError] = useState('');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDepartmentInput & { isActive: boolean }> }) =>
      departmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      departmentsApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const openCreate = () => {
    setEditingDept(null);
    setForm({ name: '', code: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({ name: dept.name, code: dept.code, description: dept.description });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDept(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingDept) {
        await updateMutation.mutateAsync({ id: editingDept.id, data: form });
      } else {
        await createMutation.mutateAsync(form);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleToggleActive = (dept: Department) => {
    const action = dept.isActive ? 'Deactivate' : 'Reactivate';
    if (confirm(`${action} ${dept.name}?`)) {
      toggleActiveMutation.mutate({ id: dept.id, isActive: !dept.isActive });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Departments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage naval departments</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
        >
          + Add Department
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-gray-500">Loading departments...</p>
        ) : departments?.length === 0 ? (
          <p className="p-6 text-gray-500">No departments found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departments?.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{dept.name}</td>
                  <td className="px-4 py-3 text-gray-600">{dept.code}</td>
                  <td className="px-4 py-3 text-gray-600">{dept.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        dept.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(dept)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(dept)}
                        disabled={toggleActiveMutation.isPending}
                        className={`text-xs font-medium ${
                          dept.isActive
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        } disabled:opacity-50`}
                      >
                        {dept.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editingDept ? 'Edit Department' : 'Add Department'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Code</label>
              <input
                type="text"
                required
                maxLength={10}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingDept
                  ? 'Update'
                  : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
