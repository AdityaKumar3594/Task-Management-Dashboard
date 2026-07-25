import type { DashboardSummary } from '../types';

interface KpiCardProps {
  label: string;
  value: number;
  color: string;
}

function KpiCard({ label, value, color }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total Tasks" value={summary.total} color="text-navy" />
      <KpiCard label="Completed" value={summary.completed} color="text-green-600" />
      <KpiCard label="Ongoing" value={summary.ongoing} color="text-blue-600" />
      <KpiCard label="Overdue" value={summary.overdue} color="text-red-600" />
    </div>
  );
}
