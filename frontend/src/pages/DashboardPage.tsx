import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { dashboardApi } from '../api';
import { useAuth } from '../context/AuthContext';
import SummaryCards from '../components/SummaryCards';
import DeptCard from '../components/DeptCard';

export default function DashboardPage() {
  const { isAdmin, user } = useAuth();
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
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="h-7 w-36 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-100" />
        </div>
        {/* KPI card skeletons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-[220px] animate-pulse rounded-lg bg-gray-100" />
        </div>
        {/* Dept card skeletons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex justify-between">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1,2,3,4].map((j) => (
                  <div key={j} className="flex flex-col items-center gap-1">
                    <div className="h-6 w-8 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-10 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
              <div className="mt-4 h-2 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
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
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin
            ? 'Organisation-wide task status overview'
            : `${user?.department?.name ?? 'Department'} task status overview`}
        </p>
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
