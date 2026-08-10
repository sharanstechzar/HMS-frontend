import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, AlertTriangle, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { PHARMACY, EXPORT_ROLES } from '../config/modules';

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

export default function Pharmacy() {
  const { user } = useAuth();
  const [tab, setTab] = useState('stock'); // stock | sales
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medModal, setMedModal] = useState(false);
  const [saleModal, setSaleModal] = useState(false);
  const [medForm, setMedForm] = useState({ name: '', category: '', brand: '', unit: 'tablet', price: '', stockQuantity: '', reorderLevel: 10, expiryDate: '' });
  const [saleForm, setSaleForm] = useState({ patient: '', items: [] });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = PHARMACY.includes(user.role);
  const canExport = EXPORT_ROLES.includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const [m, s, p] = await Promise.all([
        api.get('/medicines', { params: { limit: 200 } }),
        api.get('/pharmacy-sales'),
        api.get('/patients', { params: { limit: 200 } }),
      ]);
      setMedicines(m.data.data);
      setSales(s.data.data);
      setPatients(p.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await api.post('/medicines', medForm);
      setMedModal(false);
      setMedForm({ name: '', category: '', brand: '', unit: 'tablet', price: '', stockQuantity: '', reorderLevel: 10, expiryDate: '' });
      load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to add medicine');
    } finally {
      setSaving(false);
    }
  };

  const addSaleItem = () => setSaleForm((f) => ({ ...f, items: [...f.items, { medicine: '', quantity: 1 }] }));
  const updateSaleItem = (idx, key, value) => {
    setSaleForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [key]: value };
      return { ...f, items };
    });
  };
  const removeSaleItem = (idx) => setSaleForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const saleTotal = saleForm.items.reduce((sum, it) => {
    const med = medicines.find((m) => m._id === it.medicine);
    return sum + (med ? med.price * (Number(it.quantity) || 0) : 0);
  }, 0);

  const handleSale = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await api.post('/pharmacy-sales', saleForm);
      setSaleModal(false);
      setSaleForm({ patient: '', items: [] });
      load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Sale failed — check stock availability');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = async () => {
    const res = await api.get('/medicines/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medicines-export.csv';
    link.click();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <div className="flex gap-3 w-full sm:w-auto">
          <button className={`flex-1 sm:flex-none btn ${tab === 'stock' ? 'btn-primary' : 'btn-secondary bg-white'}`} onClick={() => setTab('stock')}>Medicine Stock</button>
          <button className={`flex-1 sm:flex-none btn ${tab === 'sales' ? 'btn-primary' : 'btn-secondary bg-white'}`} onClick={() => setTab('sales')}>Sales History</button>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {canExport && tab === 'stock' && (
            <button className="flex-1 sm:flex-none btn btn-secondary bg-white" onClick={exportCsv}>Export</button>
          )}
          {canManage && tab === 'stock' && (
            <button className="flex-1 sm:flex-none btn btn-primary" onClick={() => setMedModal(true)}><Plus size={16} /> Add Medicine</button>
          )}
          {canManage && tab === 'sales' && (
            <button className="flex-1 sm:flex-none btn btn-primary" onClick={() => setSaleModal(true)}><ShoppingCart size={16} /> New Sale</button>
          )}
        </div>
      </div>

      {tab === 'stock' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Name', 'Category', 'Price', 'Stock', 'Status', 'Expiry'].map(h => (
                    <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-[14px]">Loading...</td></tr>}
                {!loading && medicines.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-[14px]">No medicines found.</td></tr>}
                {!loading && medicines.map((m) => {
                  const low = m.stockQuantity <= m.reorderLevel;
                  return (
                    <tr key={m._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                      <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{m.name} <span className="text-slate-500 text-[13px] font-normal ml-1">{m.brand}</span></td>
                      <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{m.category || '—'}</td>
                      <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">₹{m.price}</td>
                      <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{m.stockQuantity} {m.unit}</td>
                      <td className="p-3.5 px-4 whitespace-nowrap">
                        {low
                          ? <Badge tone="red"><span className="flex items-center gap-1"><AlertTriangle size={12} /> Low stock</span></Badge>
                          : <Badge tone="green">In stock</Badge>}
                      </td>
                      <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {['Patient', 'Items', 'Total', 'Sold By', 'Date', 'Payment'].map(h => (
                    <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-[14px]">Loading...</td></tr>}
                {!loading && sales.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-[14px]">No sales recorded yet.</td></tr>}
                {!loading && sales.map((s) => (
                  <tr key={s._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                    <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{s.patient?.name || 'Walk-in'}</td>
                    <td className="p-3.5 px-4 text-slate-600 truncate max-w-xs" title={s.items.map((it) => `${it.medicine?.name} x${it.quantity}`).join(', ')}>
                      {s.items.map((it) => `${it.medicine?.name} x${it.quantity}`).join(', ')}
                    </td>
                    <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">₹{s.totalAmount}</td>
                    <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{s.soldBy?.name}</td>
                    <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="p-3.5 px-4 whitespace-nowrap"><Badge tone={s.paymentStatus === 'paid' ? 'green' : 'amber'}>{s.paymentStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {medModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setMedModal(false)}>
          <div className="bg-surface rounded-xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">Add Medicine</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setMedModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddMedicine} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
                {err && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{err}</div>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Name *</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Category</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={medForm.category} onChange={(e) => setMedForm({ ...medForm, category: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Brand</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={medForm.brand} onChange={(e) => setMedForm({ ...medForm, brand: e.target.value })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Price (₹) *</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" required value={medForm.price} onChange={(e) => setMedForm({ ...medForm, price: Number(e.target.value) })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Stock Quantity *</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" required value={medForm.stockQuantity} onChange={(e) => setMedForm({ ...medForm, stockQuantity: Number(e.target.value) })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Reorder Level</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" value={medForm.reorderLevel} onChange={(e) => setMedForm({ ...medForm, reorderLevel: Number(e.target.value) })} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Expiry Date</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="date" value={medForm.expiryDate} onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })} />
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
                <button type="button" className="btn btn-secondary" onClick={() => setMedModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {saleModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setSaleModal(false)}>
          <div className="bg-surface rounded-xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">New Pharmacy Sale</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setSaleModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSale} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
                {err && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{err}</div>}
                
                <div className="flex flex-col gap-1.5 mb-2">
                  <label className="text-[13px] font-semibold text-slate-500">Patient</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={saleForm.patient} onChange={(e) => setSaleForm({ ...saleForm, patient: e.target.value })}>
                    <option value="">Walk-in customer</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-3">
                  {saleForm.items.map((it, idx) => (
                    <div key={idx} className="flex gap-3 items-end p-3 border border-border rounded-lg bg-slate-50/50">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <label className="text-[13px] font-semibold text-slate-500">Medicine *</label>
                        <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={it.medicine} onChange={(e) => updateSaleItem(idx, 'medicine', e.target.value)} required>
                          <option value="">Select...</option>
                          {medicines.map((m) => <option key={m._id} value={m._id} disabled={m.stockQuantity <= 0}>{m.name} (₹{m.price}, {m.stockQuantity} left)</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5 w-24">
                        <label className="text-[13px] font-semibold text-slate-500">Qty *</label>
                        <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" min="1" value={it.quantity} onChange={(e) => updateSaleItem(idx, 'quantity', Number(e.target.value))} required />
                      </div>
                      <button type="button" className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={() => removeSaleItem(idx)}><Trash2 size={20} /></button>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn btn-secondary self-start mt-1" onClick={addSaleItem}>
                  <Plus size={16} /> Add Item
                </button>

                <div className="h-px bg-border my-2"></div>
                <div className="text-[18px] font-semibold text-slate-800 self-end">Total: ₹{saleTotal.toFixed(2)}</div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
                <button type="button" className="btn btn-secondary" onClick={() => setSaleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || saleForm.items.length === 0}>{saving ? 'Processing...' : 'Complete Sale'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
