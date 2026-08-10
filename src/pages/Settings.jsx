import { useState, useEffect } from 'react';
import { KeyRound, UserCog, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ADMIN, ROLES } from '../config/modules';
import './Appointments.css';

const ROLE_LABELS = {
  super_admin: 'Super Admin', hospital_admin: 'Hospital Admin', doctor: 'Doctor', nurse: 'Nurse',
  receptionist: 'Receptionist', pharmacist: 'Pharmacist', lab_technician: 'Lab Technician',
  radiologist: 'Radiologist', accountant: 'Accountant', cashier: 'Cashier', patient: 'Patient',
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
    <div>
      {/* ---- Change password (every role) ---- */}
      <div className="datatable-card" style={{ padding: 24, maxWidth: 480, marginBottom: 24 }}>
        <h3 className="text-section-title" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyRound size={18} /> Change Password
        </h3>
        <p className="text-meta" style={{ marginBottom: 16 }}>Update the password used to sign in to your account.</p>
        {pwMsg && <div className="page-toast" style={{ position: 'static', marginBottom: 12 }}>{pwMsg}</div>}
        {pwErr && <div className="login-error" style={{ marginBottom: 12 }}>{pwErr}</div>}
        <form onSubmit={handlePasswordChange}>
          <div className="form-field"><label>Current Password *</label><input type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
          <div className="form-field"><label>New Password *</label><input type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
          <div className="form-field"><label>Confirm New Password *</label><input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Password'}</button>
        </form>
      </div>

      {/* ---- Admin: staff & role management ---- */}
      {isAdmin && (
        <div className="datatable-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 className="text-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCog size={18} /> Staff & Role Management
            </h3>
            <button className="btn btn-primary" onClick={() => setStaffModal(true)}>Create Staff Account</button>
          </div>
          <p className="text-meta" style={{ marginBottom: 16 }}>
            <ShieldCheck size={13} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
            Only Super Admin and Hospital Admin can create accounts, change roles, or reset passwords — this keeps patient data access tightly controlled.
          </p>

          <div className="datatable-scroll">
            <table className="datatable">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-teal">{ROLE_LABELS[u.role]}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => handleResetPassword(u)}>Reset PW</button>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={() => handleToggleActive(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {staffModal && (
        <div className="modal-overlay" onClick={() => setStaffModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">Create Staff Account</h2></div>
            <form onSubmit={handleCreateStaff}>
              <div className="modal-body">
                {staffErr && <div className="login-error">{staffErr}</div>}
                <div className="form-field"><label>Full Name *</label><input required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} /></div>
                <div className="form-field"><label>Email *</label><input type="email" required value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} /></div>
                <div className="form-field"><label>Temporary Password *</label><input type="text" required minLength={6} value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} /></div>
                <div className="form-field">
                  <label>Role *</label>
                  <select required value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                    {ROLES.filter((r) => r !== 'patient').map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className="form-field"><label>Phone</label><input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
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
