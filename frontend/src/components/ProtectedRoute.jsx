import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Usage: <ProtectedRoute roles={['manager','admin']}> ... </ProtectedRoute>
// This only controls what the page shows. The server is what really enforces roles.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="state">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page">
        <p className="state state-error">Your role ({user.role}) does not have access to this page.</p>
      </div>
    );
  }
  return children;
}
