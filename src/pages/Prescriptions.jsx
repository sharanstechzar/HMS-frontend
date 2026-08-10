import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CLINICAL } from '../config/modules';
import './Appointments.css';

export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ patient: '', doctor: '', items: [] });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const canWrite = CLINICAL.includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/prescriptions');
      setPrescriptions(data.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    api.get('/patients', { params: { limit: 200 } }).then((r) => setPatients(r.data.data));
    api.get('/doctors', { params: { limit: 200 } }).then((r) => setDoctors(r.data.data));
  }, []);

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }] }));
  const updateItem = (idx, key, value) => setForm((f) => {
    const items = [...f.items];
    items[idx] = { ...items[idx], [key]: value };
    return { ...f, items };
  });
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await api.post('/prescriptions', form);
      setModalOpen(false);
      setForm({ patient: '', doctor: '', items: [] });
      load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="appt-toolbar">
        <span className="text-meta">{prescriptions.length} prescriptions</span>
        {canWrite && <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> New Prescription</button>}
      </div>

      <div className="datatable-card">
        <div className="datatable-scroll">
          <table className="datatable">
            <thead><tr><th>Patient</th><th>Doctor</th><th>Medicines</th><th>Dispensed</th><th>Date</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="datatable-empty">Loading...</td></tr>}
              {!loading && prescriptions.length === 0 && <tr><td colSpan={5} className="datatable-empty">No prescriptions yet.</td></tr>}
              {!loading && prescriptions.map((p) => (
                <tr key={p._id}>
                  <td>{p.patient?.name} <span className="text-meta">({p.patient?.patientId})</span></td>
                  <td>Dr. {p.doctor?.user?.name}</td>
                  <td>{p.items.map((i) => i.medicineName).join(', ')}</td>
                  <td><span className={`badge ${p.dispensed ? 'badge-green' : 'badge-amber'}`}>{p.dispensed ? 'Dispensed' : 'Pending'}</span></td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">New Prescription</h2></div>
            <form onSubmit={handleSubmit}>
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
                    {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>)}
                  </select>
                </div>

                {form.items.map((it, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="form-field" style={{ flex: 2 }}>
                        <label>Medicine Name</label>
                        <input required value={it.medicineName} onChange={(e) => updateItem(idx, 'medicineName', e.target.value)} />
                      </div>
                      <button type="button" className="icon-btn danger" onClick={() => removeItem(idx)}><Trash2 size={16} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div className="form-field" style={{ flex: 1 }}><label>Dosage</label><input value={it.dosage} onChange={(e) => updateItem(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg" /></div>
                      <div className="form-field" style={{ flex: 1 }}><label>Frequency</label><input value={it.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} placeholder="e.g. 2x/day" /></div>
                      <div className="form-field" style={{ flex: 1 }}><label>Duration</label><input value={it.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} placeholder="e.g. 5 days" /></div>
                    </div>
                    <div className="form-field"><label>Instructions</label><input value={it.instructions} onChange={(e) => updateItem(idx, 'instructions', e.target.value)} placeholder="e.g. after food" /></div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={addItem}><Plus size={14} /> Add Medicine</button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || form.items.length === 0}>{saving ? 'Saving...' : 'Save Prescription'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
