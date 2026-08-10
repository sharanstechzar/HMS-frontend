import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ADMIN } from '../config/modules';
import './Appointments.css';

export default function Staff() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ staff: '', date: new Date().toISOString().slice(0, 10), status: 'present', shift: 'morning', checkIn: '', checkOut: '' });
  const [saving, setSaving] = useState(false);

  const canManage = ADMIN.includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/staff-attendance');
      setRecords(data.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    api.get('/users', { params: { limit: 200 } }).then((r) => setStaffList(r.data.data.filter((u) => u.role !== 'patient')));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/staff-attendance', form);
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="appt-toolbar">
        <span className="text-meta">{records.length} attendance records</span>
        {canManage && <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Mark Attendance</button>}
      </div>

      <div className="datatable-card">
        <div className="datatable-scroll">
          <table className="datatable">
            <thead><tr><th>Staff</th><th>Role</th><th>Date</th><th>Status</th><th>Shift</th><th>Check In</th><th>Check Out</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="datatable-empty">Loading...</td></tr>}
              {!loading && records.length === 0 && <tr><td colSpan={7} className="datatable-empty">No attendance records yet.</td></tr>}
              {!loading && records.map((r) => (
                <tr key={r._id}>
                  <td>{r.staff?.name}</td>
                  <td className="text-meta">{r.staff?.role?.replace(/_/g, ' ')}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td><span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'on_leave' ? 'badge-amber' : 'badge-red'}`}>{r.status.replace('_', ' ')}</span></td>
                  <td>{r.shift}</td>
                  <td>{r.checkIn || '—'}</td>
                  <td>{r.checkOut || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">Mark Attendance</h2></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Staff Member *</label>
                  <select required value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })}>
                    <option value="">Select staff...</option>
                    {staffList.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>)}
                  </select>
                </div>
                <div className="form-field"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="form-field">
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="present">Present</option><option value="absent">Absent</option><option value="half_day">Half Day</option><option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Shift</label>
                  <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                    <option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option>
                  </select>
                </div>
                <div className="form-field"><label>Check In</label><input type="text" placeholder="09:00 AM" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
                <div className="form-field"><label>Check Out</label><input type="text" placeholder="05:00 PM" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
