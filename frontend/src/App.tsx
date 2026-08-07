import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { AdminRoute, AdminOrOfficerRoute } from './components/ProtectedRoute';
import ApiWarmup from './components/ApiWarmup';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import DepartmentsPage from './pages/DepartmentsPage';
import UsersPage from './pages/UsersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ApiWarmup />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              {/* Departments: admin can edit, officer can view */}
              <Route element={<AdminOrOfficerRoute />}>
                <Route path="/departments" element={<DepartmentsPage />} />
              </Route>
              {/* Users: admin only */}
              <Route element={<AdminRoute />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
