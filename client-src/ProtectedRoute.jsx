import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Usage: <ProtectedRoute roles={['manager', 'admin']}><ProductForm /></ProtectedRoute>
// This only controls what the page shows. The server is what really enforces roles.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <p>You don't have access to this page.</p>;
  }
  return children;
}
