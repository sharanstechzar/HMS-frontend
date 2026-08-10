import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Topbar.css';

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

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <h1 className="text-page-title">{title}</h1>

      <div className="topbar-user" onClick={() => setOpen((o) => !o)}>
        <div className="topbar-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
        <div className="topbar-userinfo">
          <span className="text-body" style={{ fontWeight: 600 }}>{user?.name}</span>
          <span className="text-meta">{ROLE_LABELS[user?.role] || user?.role}</span>
        </div>
        <ChevronDown size={16} />

        {open && (
          <div className="topbar-menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => navigate('/settings')}>
              <User size={16} /> Profile & Settings
            </button>
            <button onClick={handleLogout} className="danger">
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
