import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi } from '../api';
import SummaryCards from '../components/SummaryCards';
import DeptCard from '../components/DeptCard';

export default function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
  });

  const deptQuery = useQuery({
    queryKey: ['dashboard', 'by-department'],
    queryFn: dashboardApi.getByDepartment,
  });

  if (summaryQuery.isLoading || deptQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (summaryQuery.isError || deptQuery.isError) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
        Failed to load dashboard data.
      </div>
    );
  }

  const summary = summaryQuery.data!;
  const departments = deptQuery.data!;

  const chartData = departments.map((d) => ({
    name: d.code,
    Completed: d.completed,
    Ongoing: d.ongoing,
    Overdue: d.overdue,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-navy sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Department-wise task status overview</p>
      </div>

      <SummaryCards summary={summary} />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-navy sm:text-lg">Status by Department</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220} className="sm:!h-[300px]">
            <BarChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Completed" fill="#16a34a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Ongoing" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Overdue" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">No department data available.</p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-navy sm:text-lg">Department Breakdown</h2>
        {departments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {departments.map((dept) => (
              <DeptCard key={dept.departmentId} dept={dept} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No departments found.</p>
        )}
      </div>
    </div>
  );
}
