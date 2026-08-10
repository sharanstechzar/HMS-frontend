import { useState, useEffect } from 'react';
import { Plus, Search, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FRONT_DESK } from '../config/modules';
import DepartmentDoctorSelect from '../components/common/DepartmentDoctorSelect';

const STATUS_TONE = {
  booked: 'bg-teal-50 text-teal-700 border-teal-200',
  checked_in: 'bg-amber-50 text-amber-700 border-amber-200',
  in_consultation: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  rescheduled: 'bg-slate-100 text-slate-700 border-slate-200',
  no_show: 'bg-red-50 text-red-700 border-red-200',
};

const Badge = ({ children, tone = 'bg-slate-100 text-slate-700 border-slate-200' }) => (
  <span className={`px-2 py-0.5 rounded-md text-[12px] font-medium border ${tone} whitespace-nowrap`}>
    {children}
  </span>
);

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ patient: '', department: '', doctor: '', date: '', timeSlot: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const canBook = FRONT_DESK.includes(user.role);
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toTimeString().slice(0, 5);

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
    api.get('/departments', { params: { limit: 100 } }).then((r) => setDepartments(r.data.data));
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const { department, ...payload } = form; // department is a client-side filter only; backend derives it from the doctor
      await api.post('/appointments', { ...payload, date: form.date || dateFilter });
      setModalOpen(false);
      setForm({ patient: '', department: '', doctor: '', date: '', timeSlot: '', reason: '' });
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
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-md w-full md:max-w-[200px] focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent">
          <Search size={17} className="text-slate-400" />
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="border-none bg-transparent outline-none w-full text-[15px] text-slate-800"
          />
        </div>
        {canBook && (
          <button className="btn btn-primary whitespace-nowrap" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Book Appointment
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Token', 'Patient', 'Doctor', 'Time', 'Reason', 'Status'].map(h => (
                  <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
                {canBook && <th className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border text-right whitespace-nowrap">Update</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-8 text-center text-slate-500 bg-slate-50/30">Loading...</td></tr>}
              {!loading && appointments.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500 bg-slate-50/30">No appointments for this date.</td></tr>}
              {!loading && appointments.map((a) => (
                <tr key={a._id} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 px-4"><Badge tone={STATUS_TONE.booked}>#{a.tokenNumber}</Badge></td>
                  <td className="p-3.5 px-4 whitespace-nowrap"><span className="font-medium text-slate-800">{a.patient?.name}</span> <span className="text-meta">({a.patient?.patientId})</span></td>
                  <td className="p-3.5 px-4 whitespace-nowrap"><span className="font-medium text-slate-800">Dr. {a.doctor?.user?.name}</span> <span className="text-meta">— {a.doctor?.department?.name}</span></td>
                  <td className="p-3.5 px-4 whitespace-nowrap">{a.timeSlot}</td>
                  <td className="p-3.5 px-4">{a.reason || '—'}</td>
                  <td className="p-3.5 px-4"><Badge tone={STATUS_TONE[a.status]}>{a.status.replace('_', ' ')}</Badge></td>
                  {canBook && (
                    <td className="p-3.5 px-4 text-right">
                      <select 
                        value={a.status} 
                        onChange={(e) => updateStatus(a._id, e.target.value)} 
                        className="p-1.5 px-2 border border-border rounded-md text-[13px] font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                      >
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
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-surface rounded-xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-section-title">Book Appointment</h2>
              <button className="icon-btn" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleBook} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
                {err && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{err}</div>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Patient <span className="text-red-600">*</span></label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>
                
                <DepartmentDoctorSelect
                  departments={departments}
                  doctors={doctors}
                  department={form.department}
                  doctor={form.doctor}
                  onDepartmentChange={(v) => setForm({ ...form, department: v, doctor: '' })}
                  onDoctorChange={(v) => setForm({ ...form, doctor: v })}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-500">Date <span className="text-red-600">*</span></label>
                    <input
                      className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none"
                      type="date"
                      required
                      min={todayStr}
                      value={form.date || dateFilter}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-500">Time <span className="text-red-600">*</span></label>
                    <input
                      className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none"
                      type="time"
                      required
                      min={(form.date || dateFilter) === todayStr ? nowTimeStr : undefined}
                      value={form.timeSlot}
                      onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Reason for Visit</label>
                  <textarea className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
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
