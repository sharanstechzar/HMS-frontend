import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CLINICAL } from '../config/modules';

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
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <span className="text-meta font-medium">{prescriptions.length} prescriptions</span>
        {canWrite && <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> New Prescription</button>}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Patient', 'Doctor', 'Medicines', 'Dispensed', 'Date'].map(h => (
                  <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-[14px]">Loading...</td></tr>}
              {!loading && prescriptions.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-[14px]">No prescriptions yet.</td></tr>}
              {!loading && prescriptions.map((p) => (
                <tr key={p._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                  <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{p.patient?.name} <span className="text-slate-500 text-[13px] font-normal ml-1">({p.patient?.patientId})</span></td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">Dr. {p.doctor?.user?.name}</td>
                  <td className="p-3.5 px-4 text-slate-600 truncate max-w-xs" title={p.items.map((i) => i.medicineName).join(', ')}>
                    {p.items.map((i) => i.medicineName).join(', ')}
                  </td>
                  <td className="p-3.5 px-4 whitespace-nowrap"><Badge tone={p.dispensed ? 'green' : 'amber'}>{p.dispensed ? 'Dispensed' : 'Pending'}</Badge></td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">New Prescription</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
                {err && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{err}</div>}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[13px] font-semibold text-slate-500">Patient *</label>
                    <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                      <option value="">Select patient...</option>
                      {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[13px] font-semibold text-slate-500">Doctor *</label>
                    <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
                      <option value="">Select doctor...</option>
                      {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="h-px bg-border my-2"></div>

                {form.items.map((it, idx) => (
                  <div key={idx} className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-slate-50/50">
                    <div className="flex gap-3 items-end">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[13px] font-semibold text-slate-500">Medicine Name *</label>
                        <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={it.medicineName} onChange={(e) => updateItem(idx, 'medicineName', e.target.value)} />
                      </div>
                      <button type="button" className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={() => removeItem(idx)}><Trash2 size={20} /></button>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[13px] font-semibold text-slate-500">Dosage</label>
                        <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={it.dosage} onChange={(e) => updateItem(idx, 'dosage', e.target.value)} placeholder="e.g. 500mg" />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[13px] font-semibold text-slate-500">Frequency</label>
                        <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={it.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} placeholder="e.g. 2x/day" />
                      </div>
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[13px] font-semibold text-slate-500">Duration</label>
                        <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={it.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} placeholder="e.g. 5 days" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-slate-500">Instructions</label>
                      <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={it.instructions} onChange={(e) => updateItem(idx, 'instructions', e.target.value)} placeholder="e.g. after food" />
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-secondary self-start" onClick={addItem}><Plus size={16} /> Add Medicine</button>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
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
