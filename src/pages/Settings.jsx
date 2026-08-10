import { useState, useEffect } from 'react';
import { KeyRound, UserCog, ShieldCheck, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ADMIN, ROLES } from '../config/modules';

const ROLE_LABELS = {
  super_admin: 'Super Admin', hospital_admin: 'Hospital Admin', doctor: 'Doctor', nurse: 'Nurse',
  receptionist: 'Receptionist', pharmacist: 'Pharmacist', lab_technician: 'Lab Technician',
  radiologist: 'Radiologist', accountant: 'Accountant', cashier: 'Cashier', patient: 'Patient',
};

const Badge = ({ children, tone = 'gray' }) => {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[12px] font-medium border ${tones[tone]} whitespace-nowrap`}>
      {children}
    </span>
  );
};

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = ADMIN.includes(user.role);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'receptionist', phone: '' });
  const [staffErr, setStaffErr] = useState('');

  useEffect(() => {
    if (isAdmin) api.get('/users', { params: { limit: 200 } }).then((r) => setUsers(r.data.data));
  }, [isAdmin]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwErr('New password and confirmation do not match');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/change-password', pwForm);
      setPwMsg('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (error) {
      setPwErr(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffErr('');
    try {
      await api.post('/users', staffForm);
      setStaffModal(false);
      setStaffForm({ name: '', email: '', password: '', role: 'receptionist', phone: '' });
      const { data } = await api.get('/users', { params: { limit: 200 } });
      setUsers(data.data);
    } catch (error) {
      setStaffErr(error.response?.data?.message || 'Failed to create account');
    }
  };

  const handleToggleActive = async (u) => {
    await api.put(`/users/${u._id}`, { isActive: !u.isActive });
    const { data } = await api.get('/users', { params: { limit: 200 } });
    setUsers(data.data);
  };

  const handleResetPassword = async (u) => {
    const pw = window.prompt(`New temporary password for ${u.name}:`, 'Welcome@123');
    if (!pw) return;
    await api.put(`/auth/reset-password/${u._id}`, { newPassword: pw });
    alert(`Password reset for ${u.name}`);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ---- Change password (every role) ---- */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 w-full max-w-lg">
        <h3 className="text-section-title flex items-center gap-2 mb-1.5">
          <KeyRound size={18} /> Change Password
        </h3>
        <p className="text-meta mb-4">Update the password used to sign in to your account.</p>
        
        {pwMsg && <div className="page-toast mb-4">{pwMsg}</div>}
        {pwErr && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{pwErr}</div>}
        
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Current Password *</label>
            <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">New Password *</label>
            <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Confirm New Password *</label>
            <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="password" required value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary self-start mt-2" disabled={saving}>{saving ? 'Saving...' : 'Update Password'}</button>
        </form>
      </div>

      {/* ---- Admin: staff & role management ---- */}
      {isAdmin && (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 flex flex-col flex-1">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
            <h3 className="text-section-title flex items-center gap-2">
              <UserCog size={18} /> Staff & Role Management
            </h3>
            <button className="btn btn-primary whitespace-nowrap" onClick={() => setStaffModal(true)}>Create Staff Account</button>
          </div>
          <p className="text-meta mb-4 flex items-start gap-1.5 max-w-3xl">
            <ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" />
            <span>Only Super Admin and Hospital Admin can create accounts, change roles, or reset passwords — this keeps patient data access tightly controlled.</span>
          </p>

          <div className="overflow-x-auto border border-border rounded-lg mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                    <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{u.name}</td>
                    <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{u.email}</td>
                    <td className="p-3.5 px-4"><Badge tone="teal">{ROLE_LABELS[u.role]}</Badge></td>
                    <td className="p-3.5 px-4"><Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Badge></td>
                    <td className="p-3.5 px-4">
                      <div className="flex gap-2">
                        <button className="btn btn-secondary !py-1 !px-2.5 !text-[13px]" onClick={() => handleResetPassword(u)}>Reset PW</button>
                        <button className="btn btn-secondary !py-1 !px-2.5 !text-[13px]" onClick={() => handleToggleActive(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {staffModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setStaffModal(false)}>
          <div className="bg-surface rounded-xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-section-title">Create Staff Account</h2>
              <button className="icon-btn" onClick={() => setStaffModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateStaff} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
                {staffErr && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{staffErr}</div>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Full Name <span className="text-red-600">*</span></label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Email <span className="text-red-600">*</span></label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="email" required value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Temporary Password <span className="text-red-600">*</span></label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="text" required minLength={6} value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Role <span className="text-red-600">*</span></label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                    {ROLES.filter((r) => r !== 'patient').map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Phone</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
                <button type="button" className="btn btn-secondary" onClick={() => setStaffModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
