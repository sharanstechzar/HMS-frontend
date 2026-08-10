import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getModuleByPath } from '../../config/modules';

export default function AppLayout() {
  const location = useLocation();
  const mod = getModuleByPath(location.pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar title={mod?.label || 'MediCore HMS'} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-7 md:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
