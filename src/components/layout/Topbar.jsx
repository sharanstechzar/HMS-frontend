import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  hospital_admin: 'Hospital Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  radiologist: 'Radiologist',
  accountant: 'Accountant',
  cashier: 'Cashier',
  patient: 'Patient',
};

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-[68px] min-h-[68px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-7 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-slate-600 hover:text-slate-900" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <h1 className="text-[20px] md:text-[25px] font-bold text-slate-900 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2.5 cursor-pointer relative p-1.5 px-2.5 rounded-md hover:bg-background" onClick={() => setOpen((o) => !o)}>
        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-[15px]">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="hidden md:flex flex-col leading-tight">
          <span className="text-[15px] text-slate-800 font-semibold">{user?.name}</span>
          <span className="text-[13px] text-slate-500">{ROLE_LABELS[user?.role] || user?.role}</span>
        </div>
        <ChevronDown size={16} className="text-slate-500" />

        {open && (
          <div className="absolute top-[52px] right-0 bg-surface border border-border rounded-md shadow-md min-w-[200px] overflow-hidden z-20" onClick={(e) => e.stopPropagation()}>
            <button className="flex items-center gap-2.5 w-full p-3 px-4 bg-transparent border-none text-left text-[15px] text-slate-900 hover:bg-background" onClick={() => navigate('/settings')}>
              <User size={16} /> Profile & Settings
            </button>
            <button className="flex items-center gap-2.5 w-full p-3 px-4 bg-transparent border-none text-left text-[15px] text-red-600 hover:bg-red-50" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
