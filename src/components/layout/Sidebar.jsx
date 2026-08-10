import { NavLink } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { getSidebarModules } from '../../config/modules';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const modules = getSidebarModules(user?.role);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-[999] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      ></div>
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-[250px] min-w-[250px] bg-sidebar-bg flex flex-col overflow-y-auto z-[1000] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center gap-2.5 p-5 text-white text-[19px] font-bold border-b border-white/10">
          <HeartPulse size={26} strokeWidth={2.2} />
          <span>MediCore</span>
        </div>

        <nav className="flex flex-col p-2.5 pb-6 gap-0.5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <NavLink
                key={m.key}
                to={m.path}
                end={m.path === '/'}
                className={({ isActive }) => `flex items-center gap-3 p-2.5 rounded-md text-[15px] font-medium whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-white' : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-active'}`}
                onClick={() => {
                  if (window.innerWidth <= 768) onClose();
                }}
              >
                <Icon size={19} strokeWidth={2} />
                <span>{m.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
