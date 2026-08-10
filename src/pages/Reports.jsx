import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import api from '../api/axios';

const REPORTS = [
  { key: 'patients', label: 'Patients', endpoint: '/patients' },
  { key: 'appointments', label: 'Appointments', endpoint: '/appointments' },
  { key: 'invoices', label: 'Revenue / Billing', endpoint: '/invoices' },
  { key: 'pharmacy-sales', label: 'Pharmacy Sales', endpoint: '/pharmacy-sales' },
  { key: 'admissions', label: 'Bed Occupancy / Admissions', endpoint: '/admissions' },
  { key: 'lab-orders', label: 'Lab Orders', endpoint: '/lab-orders' },
  { key: 'medicines', label: 'Inventory (Pharmacy)', endpoint: '/medicines' },
];

export default function Reports() {
  const [active, setActive] = useState(REPORTS[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (report) => {
    setLoading(true);
    try {
      const { data } = await api.get(report.endpoint);
      setRows(data.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(active); }, [active]);

  const exportCsv = async () => {
    const res = await api.get(`${active.endpoint}/export/csv`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${active.key}-report.csv`;
    link.click();
  };

  const keys = rows[0] ? Object.keys(rows[0]).filter((k) => !['__v'].includes(k)).slice(0, 6) : [];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {REPORTS.map((r) => (
            <button key={r.key} className={`btn ${active.key === r.key ? 'btn-primary' : 'btn-secondary bg-white'}`} onClick={() => setActive(r)}>
              {r.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary bg-white" onClick={exportCsv}><Download size={16} /> Export CSV</button>
      </div>

      <p className="text-meta text-[14px]">
        Admin/Super Admin export access only, per hospital data-security policy. Full field-level export is available via the button above (PDF/Excel-compatible CSV).
      </p>

      <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {keys.map((k) => (
                  <th key={k} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={keys.length || 1} className="p-8 text-center text-slate-500 text-[14px]">Loading...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={keys.length || 1} className="p-8 text-center text-slate-500 text-[14px]">No data for this report yet.</td></tr>}
              {!loading && rows.slice(0, 50).map((row) => (
                <tr key={row._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                  {keys.map((k) => (
                    <td key={k} className="p-3.5 px-4 text-[14px] text-slate-700 max-w-[200px] truncate" title={typeof row[k] === 'object' && row[k] ? (row[k].name || JSON.stringify(row[k])) : String(row[k] ?? '')}>
                      {typeof row[k] === 'object' && row[k] ? (row[k].name || JSON.stringify(row[k]).slice(0, 30)) : String(row[k] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {rows.length > 50 && <p className="text-meta text-[13px] mt-1">Showing first 50 of {rows.length} records — export CSV for the full data set.</p>}
    </div>
  );
}
