import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, UserCircle, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ADMIN } from '../config/modules';

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ADMIN.includes(user.role);

  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    gender: user.gender || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await api.put('/auth/profile', profileForm);
      await refreshProfile();
      setProfileMsg('Profile updated successfully');
      setTimeout(() => setProfileMsg(''), 2500);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwErr('New password and confirmation do not match');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', pwForm);
      setPwMsg('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (error) {
      setPwErr(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      {/* ---- My Account ---- */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 w-full max-w-lg">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-[22px] flex-shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-section-title">{user.name}</div>
            <div className="text-meta">{user.email} &middot; {user.role.replace(/_/g, ' ')}</div>
          </div>
        </div>

        <h3 className="text-section-title flex items-center gap-2 mb-1.5">
          <UserCircle size={18} /> My Account
        </h3>
        <p className="text-meta mb-4">Update your personal details.</p>

        {profileMsg && <div className="page-toast mb-4">{profileMsg}</div>}

        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Full Name</label>
            <input
              className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Phone</label>
            <input
              className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Gender</label>
            <select
              className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none"
              value={profileForm.gender}
              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Address</label>
            <textarea
              rows={2}
              className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary self-start mt-2" disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ---- Change password (every role) ---- */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 w-full max-w-lg">
        <h3 className="text-section-title flex items-center gap-2 mb-1.5">
          <KeyRound size={18} /> Change Password
        </h3>
        <p className="text-meta mb-4">Update the password used to sign in to your account.</p>

        {pwMsg && <div className="page-toast mb-4">{pwMsg}</div>}
        {pwErr && <div className="p-3 mb-4 bg-danger-light text-danger rounded-md border border-red-200 text-[14px]">{pwErr}</div>}

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
          <button type="submit" className="btn btn-primary self-start mt-2" disabled={pwSaving}>{pwSaving ? 'Saving...' : 'Update Password'}</button>
        </form>
      </div>

      {/* ---- Admin: point to the dedicated Users / Roles pages ---- */}
      {isAdmin && (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 w-full max-w-lg">
          <h3 className="text-section-title flex items-center gap-2 mb-1.5">
            <Users size={18} /> Staff &amp; Role Management
          </h3>
          <p className="text-meta mb-4 flex items-start gap-1.5">
            <ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" />
            <span>Creating accounts, changing roles and editing permissions live in their own pages, so every admin sees the same, up-to-date picture.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn btn-secondary flex-1 justify-between" onClick={() => navigate('/users')}>
              Manage Users <ArrowRight size={15} />
            </button>
            <button className="btn btn-secondary flex-1 justify-between" onClick={() => navigate('/roles')}>
              Manage Roles &amp; Permissions <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
