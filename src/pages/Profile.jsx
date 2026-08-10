import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Appointments.css';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '', address: user.address || '', gender: user.gender || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      await refreshProfile();
      setMsg('Profile updated successfully');
      setTimeout(() => setMsg(''), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="datatable-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div className="topbar-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{user.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <div className="text-section-title">{user.name}</div>
            <div className="text-meta">{user.email} · {user.role.replace(/_/g, ' ')}</div>
          </div>
        </div>

        {msg && <div className="page-toast" style={{ position: 'static', marginBottom: 14 }}>{msg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field"><label>Full Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-field">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select...</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div className="form-field"><label>Address</label><textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
