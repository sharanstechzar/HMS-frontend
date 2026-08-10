import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FRONT_DESK } from '../config/modules';
import './Appointments.css';

const STATUS_TONE = {
  booked: 'badge-teal',
  checked_in: 'badge-amber',
  in_consultation: 'badge-amber',
  completed: 'badge-green',
  cancelled: 'badge-red',
  rescheduled: 'badge-gray',
  no_show: 'badge-red',
};

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ patient: '', doctor: '', date: '', timeSlot: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const canBook = FRONT_DESK.includes(user.role);

  const loadAppointments = async (date) => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments', { params: { date } });
      setAppointments(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(dateFilter); }, [dateFilter]);

  useEffect(() => {
    api.get('/patients', { params: { limit: 200 } }).then((r) => setPatients(r.data.data));
    api.get('/doctors', { params: { limit: 200 } }).then((r) => setDoctors(r.data.data));
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await api.post('/appointments', { ...form, date: form.date || dateFilter });
      setModalOpen(false);
      setForm({ patient: '', doctor: '', date: '', timeSlot: '', reason: '' });
      loadAppointments(dateFilter);
    } catch (error) {
      setErr(error.response?.data?.message || 'Booking failed');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/appointments/${id}/status`, { status });
    loadAppointments(dateFilter);
  };

  return (
    <div>
      <div className="appt-toolbar">
        <div className="datatable-search" style={{ maxWidth: 200 }}>
          <Search size={17} />
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </div>
        {canBook && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Book Appointment
          </button>
        )}
      </div>

      <div className="datatable-card">
        <div className="datatable-scroll">
          <table className="datatable">
            <thead>
              <tr>
                <th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Reason</th><th>Status</th>{canBook && <th>Update</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="datatable-empty">Loading...</td></tr>}
              {!loading && appointments.length === 0 && <tr><td colSpan={7} className="datatable-empty">No appointments for this date.</td></tr>}
              {!loading && appointments.map((a) => (
                <tr key={a._id}>
                  <td><span className="badge badge-teal">#{a.tokenNumber}</span></td>
                  <td>{a.patient?.name} <span className="text-meta">({a.patient?.patientId})</span></td>
                  <td>Dr. {a.doctor?.user?.name} <span className="text-meta">— {a.doctor?.department?.name}</span></td>
                  <td>{a.timeSlot}</td>
                  <td>{a.reason || '—'}</td>
                  <td><span className={`badge ${STATUS_TONE[a.status] || 'badge-gray'}`}>{a.status.replace('_', ' ')}</span></td>
                  {canBook && (
                    <td>
                      <select value={a.status} onChange={(e) => updateStatus(a._id, e.target.value)} className="status-select">
                        {['booked', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'].map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-section-title">Book Appointment</h2>
            </div>
            <form onSubmit={handleBook}>
              <div className="modal-body">
                {err && <div className="login-error">{err}</div>}
                <div className="form-field">
                  <label>Patient *</label>
                  <select required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Doctor *</label>
                  <select required value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
                    <option value="">Select doctor...</option>
                    {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.user?.name} — {d.specialization}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Date *</label>
                  <input type="date" required value={form.date || dateFilter} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Time Slot *</label>
                  <input type="text" required placeholder="e.g. 10:30 AM" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Reason for Visit</label>
                  <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Booking...' : 'Book Appointment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
