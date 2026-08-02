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
  const { isAdmin, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState<DisplayStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  // FIX #8: free-text search
  const [search, setSearch] = useState('');
  // track which task IDs are mid-mutation to prevent double clicks
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      setCompletingId(null);
    },
    onError: () => setCompletingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  const handleComplete = (id: string) => {
    if (completingId) return;
    if (!confirm('Mark this task as completed?')) return;
    setCompletingId(id);
    completeMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (deletingId) return;
    if (!confirm('Delete this task? This cannot be undone.')) return;
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN');
  };

  // Due-soon warning: due within 3 days and not completed
  const isDueSoon = (task: Task) => {
    if (task.displayStatus === 'completed' || !task.dueDate) return false;
    const diff = new Date(task.dueDate).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
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

  // Apply My Tasks + search filters client-side
  const displayedTasks = (tasksQuery.data ?? []).filter((task) => {
    if (myTasksOnly && user && task.assignedTo?.id !== user.id) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return task.title.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q);
    }
    return true;
  });

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
        {/* FIX #8: search input */}
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>

        {isAdmin && (
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="">All Depts</option>
            {departmentsQuery.data?.filter((d) => d.isActive).map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
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

        {/* My Tasks toggle */}
        <button
          onClick={() => setMyTasksOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
            ${myTasksOnly
              ? 'border-navy bg-navy text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:border-navy hover:text-navy'
            }`}
        >
          <span>👤</span>
          My Tasks
          {myTasksOnly && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
              {displayedTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {tasksQuery.isLoading ? (
        /* FIX #15: skeleton loader */
        <div className="space-y-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-gray-200" />
              </div>
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : tasksQuery.isError ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{getErrorMessage(tasksQuery.error)}</p>
      ) : displayedTasks.length === 0 ? (
        /* FIX #11 + #2: proper empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <div className="mb-3 text-4xl">{myTasksOnly ? '👤' : '📋'}</div>
          <p className="font-medium text-gray-600">
            {myTasksOnly ? 'No tasks assigned to you' : search ? `No tasks matching "${search}"` : 'No tasks found'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {myTasksOnly ? 'Tasks assigned to you will appear here' : 'Create a new task to get started'}
          </p>
          {(myTasksOnly || search) && (
            <button
              onClick={() => { setMyTasksOnly(false); setSearch(''); }}
              className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
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
                {displayedTasks.map((task) => (
                  <tr key={task.id} className={`hover:bg-gray-50 ${isDueSoon(task) ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                        {isDueSoon(task) && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            Due soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{task.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {task.assignedTo ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
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
                          <button
                            onClick={() => handleComplete(task.id)}
                            disabled={completingId === task.id}
                            className="text-xs font-medium text-green-600 hover:text-green-800 disabled:opacity-40"
                          >
                            {completingId === task.id ? '...' : 'Complete'}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingTask(task)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={deletingId === task.id}
                          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-40"
                        >
                          {deletingId === task.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {displayedTasks.map((task) => (
              <div key={task.id}
                className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${isDueSoon(task) ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <p className="font-medium text-gray-900 leading-snug">{task.title}</p>
                    {isDueSoon(task) && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Due soon
                      </span>
                    )}
                  </div>
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
                    <button
                      onClick={() => handleComplete(task.id)}
                      disabled={completingId === task.id}
                      className="text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-40"
                    >
                      {completingId === task.id ? '...' : '✓ Complete'}
                    </button>
                  )}
                  <button onClick={() => setEditingTask(task)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={deletingId === task.id}
                    className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-40"
                  >
                    {deletingId === task.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && departmentsQuery.data && (
        <Modal title="Create Task" onClose={() => setShowModal(false)}>
          <TaskForm departments={departmentsQuery.data} onSubmit={async (data) => { await createMutation.mutateAsync(data); }} onCancel={() => setShowModal(false)} />
        </Modal>
      )}

      {editingTask && departmentsQuery.data && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <TaskForm
            departments={departmentsQuery.data}
            task={editingTask}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({ id: editingTask.id, data });
            }}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}
