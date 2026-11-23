// Example wiring for main.jsx / App.jsx. Merge with Member C's layout.
// main.jsx:  <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { useAuth } from './AuthContext';

function LogoutButton() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <button onClick={logout}>
      Log out ({user.name}, {user.role})
    </button>
  );
}

export default function App() {
  return (
    <>
      <LogoutButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProtectedRoute><p>Products page (Member B/C)</p></ProtectedRoute>} />
        <Route
          path="/products/new"
          element={<ProtectedRoute roles={['manager', 'admin']}><p>New product form</p></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </>
  );
}
