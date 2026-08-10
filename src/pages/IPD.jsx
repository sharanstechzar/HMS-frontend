import { useState, useEffect } from 'react';
import { Plus, LogOut, ClipboardPlus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CLINICAL } from '../config/modules';
import './Appointments.css';

export default function IPD() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [noteModal, setNoteModal] = useState(null); // admission being annotated
  const [noteText, setNoteText] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient: '', doctor: '', ward: '', bed: '', reason: '' });
  const [statusFilter, setStatusFilter] = useState('admitted');

  const canManage = CLINICAL.includes(user.role);

  const loadAdmissions = async (status) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admissions', { params: status ? { status } : {} });
      setAdmissions(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmissions(statusFilter); }, [statusFilter]);

  useEffect(() => {
    api.get('/patients', { params: { limit: 200 } }).then((r) => setPatients(r.data.data));
    api.get('/doctors', { params: { limit: 200 } }).then((r) => setDoctors(r.data.data));
    api.get('/wards', { params: { limit: 100 } }).then((r) => setWards(r.data.data));
  }, []);

  useEffect(() => {
    // Refresh available beds whenever ward changes so the dropdown only shows free beds
    if (form.ward) {
      api.get('/beds', { params: { ward: form.ward, status: 'available', limit: 100 } }).then((r) => setBeds(r.data.data));
    } else {
      setBeds([]);
    }
  }, [form.ward]);

  const handleAdmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await api.post('/admissions', form);
      setModalOpen(false);
      setForm({ patient: '', doctor: '', ward: '', bed: '', reason: '' });
      loadAdmissions(statusFilter);
    } catch (error) {
      setErr(error.response?.data?.message || 'Admission failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDischarge = async (id) => {
    const summary = window.prompt('Discharge summary (optional):', '');
    if (summary === null) return;
    await api.put(`/admissions/${id}/discharge`, { dischargeSummary: summary });
    loadAdmissions(statusFilter);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await api.put(`/admissions/${noteModal._id}/daily-note`, { note: noteText });
    setNoteModal(null);
    setNoteText('');
    loadAdmissions(statusFilter);
  };

  return (
    <div>
      <div className="appt-toolbar">
        <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="admitted">Currently Admitted</option>
          <option value="discharged">Discharged</option>
          <option value="">All</option>
        </select>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Admit Patient
          </button>
        )}
      </div>

      <div className="datatable-card">
        <div className="datatable-scroll">
          <table className="datatable">
            <thead>
              <tr>
                <th>Patient</th><th>Doctor</th><th>Ward</th><th>Bed</th><th>Admitted On</th><th>Status</th>{canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="datatable-empty">Loading...</td></tr>}
              {!loading && admissions.length === 0 && <tr><td colSpan={7} className="datatable-empty">No admissions found.</td></tr>}
              {!loading && admissions.map((a) => (
                <tr key={a._id}>
                  <td>{a.patient?.name} <span className="text-meta">({a.patient?.patientId})</span></td>
                  <td>Dr. {a.doctor?.user?.name}</td>
                  <td>{a.ward?.name}</td>
                  <td>{a.bed?.bedNumber}</td>
                  <td>{new Date(a.admissionDate).toLocaleDateString()}</td>
                  <td><span className={`badge ${a.status === 'admitted' ? 'badge-teal' : 'badge-gray'}`}>{a.status}</span></td>
                  {canManage && (
                    <td style={{ display: 'flex', gap: 6 }}>
                      {a.status === 'admitted' && (
                        <>
                          <button className="icon-btn" title="Add daily note" onClick={() => setNoteModal(a)}>
                            <ClipboardPlus size={16} />
                          </button>
                          <button className="icon-btn danger" title="Discharge" onClick={() => handleDischarge(a._id)}>
                            <LogOut size={16} />
                          </button>
                        </>
                      )}
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
            <div className="modal-header"><h2 className="text-section-title">Admit Patient</h2></div>
            <form onSubmit={handleAdmit}>
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
                  <label>Attending Doctor *</label>
                  <select required value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
                    <option value="">Select doctor...</option>
                    {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Ward *</label>
                  <select required value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value, bed: '' })}>
                    <option value="">Select ward...</option>
                    {wards.map((w) => <option key={w._id} value={w._id}>{w.name} ({w.type})</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Available Bed *</label>
                  <select required value={form.bed} onChange={(e) => setForm({ ...form, bed: e.target.value })} disabled={!form.ward}>
                    <option value="">{form.ward ? (beds.length ? 'Select bed...' : 'No beds available in this ward') : 'Select a ward first'}</option>
                    {beds.map((b) => <option key={b._id} value={b._id}>{b.bedNumber} — ₹{b.dailyCharge}/day</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Reason for Admission</label>
                  <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Admitting...' : 'Admit Patient'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">Daily Note — {noteModal.patient?.name}</h2></div>
            <form onSubmit={handleAddNote}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Note *</label>
                  <textarea rows={4} autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setNoteModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
