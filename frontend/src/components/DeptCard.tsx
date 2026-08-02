import type { DepartmentBreakdown } from '../types';

interface DeptCardProps {
  dept: DepartmentBreakdown;
}

export default function DeptCard({ dept }: DeptCardProps) {
  // FIX #12: visual urgency when there are overdue tasks
  const hasOverdue = dept.overdue > 0;

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm transition-colors ${
      hasOverdue ? 'border-red-200' : 'border-gray-200'
    }`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-navy">{dept.name}</h3>
          <p className="text-xs text-gray-500">{dept.code}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-navy/10 px-2.5 py-1 text-xs font-semibold text-navy">
            {dept.completionRate}% done
          </span>
          {/* FIX #12: overdue warning badge */}
          {hasOverdue && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              {dept.overdue} overdue
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">{dept.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div>
          <p className="text-lg font-bold text-green-600">{dept.completed}</p>
          <p className="text-xs text-gray-500">Done</p>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-600">{dept.ongoing}</p>
          <p className="text-xs text-gray-500">Ongoing</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${hasOverdue ? 'text-red-600' : 'text-gray-400'}`}>
            {dept.overdue}
          </p>
          <p className="text-xs text-gray-500">Overdue</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gold transition-all"
          style={{ width: `${dept.completionRate}%` }}
        />
      </div>
    </div>
  );
}
