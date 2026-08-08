import type { Task } from '../types';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onDelete: () => void;
  completing: boolean;
  deleting: boolean;
  reopening: boolean;
  canComplete: boolean;
  canEditDelete: boolean;
}

export default function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onComplete,
  onReopen,
  onDelete,
  completing,
  deleting,
  reopening,
  canComplete,
  canEditDelete,
}: TaskDetailModalProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const isDueSoon = () => {
    if (task.displayStatus === 'completed' || !task.dueDate) return false;
    const diff = new Date(task.dueDate).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const priorityBg: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <Modal title="Task Details" onClose={onClose}>
      <div className="space-y-5">

        {/* Title + status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">{task.title}</h3>
          <StatusBadge status={task.displayStatus} />
        </div>

        {/* Description */}
        {task.description ? (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">No description provided.</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Department</p>
            <p className="font-medium text-navy">{task.department?.name || '—'}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Priority</p>
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${priorityBg[task.priority]}`}>
              {task.priority}
            </span>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Assigned To</p>
            {task.assignedTo ? (
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
                  {task.assignedTo.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium text-gray-800">{task.assignedTo.name}</span>
              </div>
            ) : (
              <p className="text-gray-400">Unassigned</p>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Created By</p>
            <p className="font-medium text-gray-800">{task.assignedBy?.name || '—'}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Due Date</p>
            <p className={`font-medium ${isDueSoon() ? 'text-amber-600' : 'text-gray-800'}`}>
              {formatDate(task.dueDate)}
              {isDueSoon() && <span className="ml-1 text-xs">(Soon)</span>}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              {task.displayStatus === 'completed' ? 'Completed On' : 'Created On'}
            </p>
            <p className="font-medium text-gray-800">
              {task.displayStatus === 'completed'
                ? formatDate(task.completedAt)
                : formatDate(task.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          {canComplete && task.displayStatus !== 'completed' && (
            <button
              onClick={onComplete}
              disabled={completing}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              {completing ? 'Completing...' : '✓ Complete'}
            </button>
          )}

          {canEditDelete && task.displayStatus === 'completed' && (
            <button
              onClick={onReopen}
              disabled={reopening}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-40"
            >
              {reopening ? '...' : 'Reopen'}
            </button>
          )}

          {canEditDelete && task.displayStatus !== 'completed' && (
            <button
              onClick={onEdit}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-light"
            >
              Edit
            </button>
          )}

          {canEditDelete && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-40"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}

          {!canComplete && !canEditDelete && (
            <p className="text-sm italic text-gray-400">View only — no actions available</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
