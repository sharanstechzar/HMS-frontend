import { useState, useEffect } from 'react';
import { Plus, LogOut, ClipboardPlus, X } from 'lucide-react';
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
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <select className="p-2.5 px-3 border border-border rounded-md text-[14px] bg-white focus:ring-2 focus:ring-accent outline-none font-medium text-slate-700" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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

      <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Patient', 'Doctor', 'Ward', 'Bed', 'Admitted On', 'Status'].map(h => (
                  <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
                {canManage && <th className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={canManage ? 7 : 6} className="p-8 text-center text-slate-500 text-[14px]">Loading...</td></tr>}
              {!loading && admissions.length === 0 && <tr><td colSpan={canManage ? 7 : 6} className="p-8 text-center text-slate-500 text-[14px]">No admissions found.</td></tr>}
              {!loading && admissions.map((a) => (
                <tr key={a._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                  <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{a.patient?.name} <span className="text-slate-500 text-[13px] font-normal ml-1">({a.patient?.patientId})</span></td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">Dr. {a.doctor?.user?.name}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{a.ward?.name}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{a.bed?.bedNumber}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{new Date(a.admissionDate).toLocaleDateString()}</td>
                  <td className="p-3.5 px-4 whitespace-nowrap"><Badge tone={a.status === 'admitted' ? 'teal' : 'gray'}>{a.status}</Badge></td>
                  {canManage && (
                    <td className="p-3.5 px-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {a.status === 'admitted' && (
                          <>
                            <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors" title="Add daily note" onClick={() => setNoteModal(a)}>
                              <ClipboardPlus size={18} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Discharge" onClick={() => handleDischarge(a._id)}>
                              <LogOut size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-surface rounded-xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">Admit Patient</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAdmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
                {err && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{err}</div>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Patient *</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Attending Doctor *</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
                    <option value="">Select doctor...</option>
                    {doctors.map((d) => <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Ward *</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value, bed: '' })}>
                    <option value="">Select ward...</option>
                    {wards.map((w) => <option key={w._id} value={w._id}>{w.name} ({w.type})</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Available Bed *</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.bed} onChange={(e) => setForm({ ...form, bed: e.target.value })} disabled={!form.ward}>
                    <option value="">{form.ward ? (beds.length ? 'Select bed...' : 'No beds available in this ward') : 'Select a ward first'}</option>
                    {beds.map((b) => <option key={b._id} value={b._id}>{b.bedNumber} — ₹{b.dailyCharge}/day</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Reason for Admission</label>
                  <textarea className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none resize-y" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Admitting...' : 'Admit Patient'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {noteModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setNoteModal(null)}>
          <div className="bg-surface rounded-xl w-full max-w-lg shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">Daily Note — {noteModal.patient?.name}</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setNoteModal(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddNote}>
              <div className="p-4 md:px-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Note *</label>
                  <textarea className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none resize-y" rows={4} autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border">
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
