import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ADMIN } from '../config/modules';

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
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <span className="text-meta font-medium">{records.length} attendance records</span>
        {canManage && <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Mark Attendance</button>}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Staff', 'Role', 'Date', 'Status', 'Shift', 'Check In', 'Check Out'].map(h => (
                  <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-8 text-center text-slate-500 text-[14px]">Loading...</td></tr>}
              {!loading && records.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500 text-[14px]">No attendance records yet.</td></tr>}
              {!loading && records.map((r) => (
                <tr key={r._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                  <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{r.staff?.name}</td>
                  <td className="p-3.5 px-4 text-slate-500 text-[13px] whitespace-nowrap">{r.staff?.role?.replace(/_/g, ' ')}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-3.5 px-4 whitespace-nowrap">
                    <Badge tone={r.status === 'present' ? 'green' : r.status === 'on_leave' ? 'amber' : 'red'}>{r.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap capitalize">{r.shift}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{r.checkIn || '—'}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{r.checkOut || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-surface rounded-xl w-full max-w-lg shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">Mark Attendance</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-4 md:px-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Staff Member *</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.staff} onChange={(e) => setForm({ ...form, staff: e.target.value })}>
                    <option value="">Select staff...</option>
                    {staffList.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Date</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Status</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="present">Present</option><option value="absent">Absent</option><option value="half_day">Half Day</option><option value="on_leave">On Leave</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Shift</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                    <option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option>
                  </select>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[13px] font-semibold text-slate-500">Check In</label>
                    <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="text" placeholder="09:00 AM" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[13px] font-semibold text-slate-500">Check Out</label>
                    <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="text" placeholder="05:00 PM" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border">
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
