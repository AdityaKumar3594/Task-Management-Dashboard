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

  const priorityBg: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-navy sm:text-2xl">Tasks</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage and track department tasks</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-navy-light sm:px-4"
        >
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:gap-3 sm:p-4">
        {isAdmin && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="">All Depts</option>
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
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[120px]"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="ongoing">Ongoing</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[120px]"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Content */}
      {tasksQuery.isLoading ? (
        <p className="py-8 text-center text-gray-500">Loading tasks...</p>
      ) : tasksQuery.isError ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{getErrorMessage(tasksQuery.error)}</p>
      ) : tasksQuery.data?.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No tasks found.</p>
      ) : (
        <>
          {/* Desktop table — hidden on mobile */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Task</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Department</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Assigned To</th>
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
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{task.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.assignedTo ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
                            {task.assignedTo.name.charAt(0).toUpperCase()}
                          </span>
                          {task.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-medium capitalize ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(task.dueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.displayStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {task.displayStatus !== 'completed' && (
                          <button onClick={() => completeMutation.mutate(task.id)}
                            className="text-xs font-medium text-green-600 hover:text-green-800">
                            Complete
                          </button>
                        )}
                        <button onClick={() => setEditingTask(task)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800">
                          Edit
                        </button>
                        <button onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(task.id); }}
                          className="text-xs font-medium text-red-600 hover:text-red-800">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — shown only on small screens */}
          <div className="space-y-3 md:hidden">
            {tasksQuery.data?.map((task) => (
              <div key={task.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 leading-snug">{task.title}</p>
                  <StatusBadge status={task.displayStatus} />
                </div>
                {task.description && (
                  <p className="mb-2 text-xs text-gray-500 line-clamp-2">{task.description}</p>
                )}
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${priorityBg[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.department && (
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 font-medium text-navy">
                      {task.department.name}
                    </span>
                  )}
                  {task.assignedTo && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                      👤 {task.assignedTo.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-gray-500">Due: {formatDate(task.dueDate)}</span>
                  )}
                </div>
                <div className="flex gap-3 border-t border-gray-100 pt-2">
                  {task.displayStatus !== 'completed' && (
                    <button onClick={() => completeMutation.mutate(task.id)}
                      className="text-sm font-medium text-green-600 hover:text-green-800">
                      ✓ Complete
                    </button>
                  )}
                  <button onClick={() => setEditingTask(task)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    Edit
                  </button>
                  <button onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate(task.id); }}
                    className="text-sm font-medium text-red-600 hover:text-red-800">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && departmentsQuery.data && (
        <Modal title="Create Task" onClose={() => setShowModal(false)}>
          <TaskForm departments={departmentsQuery.data} onSubmit={handleCreate} onCancel={() => setShowModal(false)} />
        </Modal>
      )}

      {editingTask && departmentsQuery.data && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <TaskForm departments={departmentsQuery.data} task={editingTask} onSubmit={handleUpdate} onCancel={() => setEditingTask(null)} />
        </Modal>
      )}
    </div>
  );
}
