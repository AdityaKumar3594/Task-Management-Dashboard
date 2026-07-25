import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, tasksApi } from '../api';
import { getErrorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import TaskForm from '../components/TaskForm';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import type { CreateTaskInput, DisplayStatus, Task, TaskPriority } from '../types';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState<DisplayStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', filterDept, filterStatus, filterPriority],
    queryFn: () =>
      tasksApi.getAll({
        departmentId: filterDept || undefined,
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskInput> }) =>
      tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setEditingTask(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: tasksApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleCreate = async (data: CreateTaskInput) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdate = async (data: CreateTaskInput) => {
    if (!editingTask) return;
    await updateMutation.mutateAsync({ id: editingTask.id, data });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN');
  };

  const priorityColors: Record<TaskPriority, string> = {
    low: 'text-gray-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track department tasks</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
        >
          + New Task
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {isAdmin && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Departments</option>
            {departmentsQuery.data
              ?.filter((d) => d.isActive)
              .map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
          </select>
        )}

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as DisplayStatus | '')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="ongoing">Ongoing</option>
          <option value="overdue">Overdue</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {tasksQuery.isLoading ? (
          <p className="p-6 text-gray-500">Loading tasks...</p>
        ) : tasksQuery.isError ? (
          <p className="p-6 text-red-600">{getErrorMessage(tasksQuery.error)}</p>
        ) : tasksQuery.data?.length === 0 ? (
          <p className="p-6 text-gray-500">No tasks found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Task</th>
                <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                <th className="px-4 py-3 font-medium text-gray-600">Priority</th>
                <th className="px-4 py-3 font-medium text-gray-600">Due Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasksQuery.data?.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {task.department?.name || '—'}
                  </td>
                  <td className={`px-4 py-3 font-medium capitalize ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.displayStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {task.displayStatus !== 'completed' && (
                        <button
                          onClick={() => completeMutation.mutate(task.id)}
                          className="text-xs font-medium text-green-600 hover:text-green-800"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTask(task)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this task?')) {
                            deleteMutation.mutate(task.id);
                          }
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && departmentsQuery.data && (
        <Modal title="Create Task" onClose={() => setShowModal(false)}>
          <TaskForm
            departments={departmentsQuery.data}
            onSubmit={handleCreate}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}

      {editingTask && departmentsQuery.data && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <TaskForm
            departments={departmentsQuery.data}
            task={editingTask}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}
