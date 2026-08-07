import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-navy text-lg font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// Admin-only pages (Users, write operations on Departments)
export function AdminRoute() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Admin + Officer can see Departments in read-only mode
export function AdminOrOfficerRoute() {
  const { isAdmin, isOfficer, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin && !isOfficer) return <Navigate to="/" replace />;
  return <Outlet />;
}
