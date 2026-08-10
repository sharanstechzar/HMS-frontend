import { NavLink } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { getSidebarModules } from '../../config/modules';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user } = useAuth();
  const modules = getSidebarModules(user?.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <HeartPulse size={26} strokeWidth={2.2} />
        <span>MediCore</span>
      </div>

      <nav className="sidebar-nav">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <NavLink
              key={m.key}
              to={m.path}
              end={m.path === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{m.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
