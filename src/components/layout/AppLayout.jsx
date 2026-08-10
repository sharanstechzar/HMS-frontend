import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getModuleByPath } from '../../config/modules';
import './AppLayout.css';

export default function AppLayout() {
  const location = useLocation();
  const mod = getModuleByPath(location.pathname);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar title={mod?.label || 'MediCore HMS'} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
