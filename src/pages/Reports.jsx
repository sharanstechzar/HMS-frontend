import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import api from '../api/axios';
import './Appointments.css';

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
    <div>
      <div className="appt-toolbar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {REPORTS.map((r) => (
            <button key={r.key} className={`btn ${active.key === r.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActive(r)}>
              {r.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={exportCsv}><Download size={16} /> Export CSV</button>
      </div>

      <p className="text-meta" style={{ marginBottom: 10 }}>
        Admin/Super Admin export access only, per hospital data-security policy. Full field-level export is available via the button above (PDF/Excel-compatible CSV).
      </p>

      <div className="datatable-card">
        <div className="datatable-scroll">
          <table className="datatable">
            <thead>
              <tr>{keys.map((k) => <th key={k}>{k}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={keys.length || 1} className="datatable-empty">Loading...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={keys.length || 1} className="datatable-empty">No data for this report yet.</td></tr>}
              {!loading && rows.slice(0, 50).map((row) => (
                <tr key={row._id}>
                  {keys.map((k) => (
                    <td key={k}>{typeof row[k] === 'object' && row[k] ? (row[k].name || JSON.stringify(row[k]).slice(0, 30)) : String(row[k] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {rows.length > 50 && <p className="text-meta" style={{ marginTop: 8 }}>Showing first 50 of {rows.length} records — export CSV for the full data set.</p>}
    </div>
  );
}
