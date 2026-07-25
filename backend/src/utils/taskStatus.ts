import { DisplayStatus, TaskStoredStatus } from '../types';

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDisplayStatus(
  status: TaskStoredStatus,
  dueDate: Date | null | undefined,
  now: Date = new Date()
): DisplayStatus {
  if (status === 'completed') {
    return 'completed';
  }

  if (dueDate && startOfDay(new Date(dueDate)) < startOfDay(now)) {
    return 'overdue';
  }

  return 'ongoing';
}

export interface TaskLike {
  status: TaskStoredStatus;
  dueDate?: Date | null;
}

export function countByDisplayStatus(tasks: TaskLike[]) {
  return tasks.reduce(
    (acc, task) => {
      const displayStatus = getDisplayStatus(task.status, task.dueDate);
      acc[displayStatus] += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, completed: 0, ongoing: 0, overdue: 0 }
  );
}
