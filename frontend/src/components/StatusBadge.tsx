import type { DisplayStatus } from '../types';

const styles: Record<DisplayStatus, string> = {
  completed: 'bg-green-100 text-green-800 border-green-200',
  ongoing: 'bg-blue-100 text-blue-800 border-blue-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
};

const labels: Record<DisplayStatus, string> = {
  completed: 'Completed',
  ongoing: 'Ongoing',
  overdue: 'Overdue',
};

export default function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
