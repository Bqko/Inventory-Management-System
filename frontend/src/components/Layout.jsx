import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/products', label: 'Products' },
    { to: '/suppliers', label: 'Suppliers' },
    { to: '/categories', label: 'Categories' },
    { to: '/movements', label: 'Movements', roles: ['admin'] },
    { to: '/users', label: 'Users', roles: ['admin'] },
  ].filter((l) => !l.roles || l.roles.includes(user.role));

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Inventory</div>
        <nav aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-name">{user.name}</div>
          <div className="user-role">{user.role}</div>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
