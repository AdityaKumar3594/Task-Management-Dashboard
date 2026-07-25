import type { DepartmentBreakdown } from '../types';

export default function DeptCard({ dept }: { dept: DepartmentBreakdown }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-navy">{dept.name}</h3>
          <p className="text-xs text-gray-500">{dept.code}</p>
        </div>
        <span className="rounded-full bg-navy/10 px-2.5 py-1 text-xs font-semibold text-navy">
          {dept.completionRate}% done
        </span>
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
          <p className="text-lg font-bold text-red-600">{dept.overdue}</p>
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
