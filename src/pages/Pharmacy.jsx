import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { PHARMACY, EXPORT_ROLES } from '../config/modules';
import './Appointments.css';

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
    <div>
      <div className="appt-toolbar">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${tab === 'stock' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('stock')}>Medicine Stock</button>
          <button className={`btn ${tab === 'sales' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('sales')}>Sales History</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canExport && tab === 'stock' && (
            <button className="btn btn-secondary" onClick={exportCsv}>Export</button>
          )}
          {canManage && tab === 'stock' && (
            <button className="btn btn-primary" onClick={() => setMedModal(true)}><Plus size={16} /> Add Medicine</button>
          )}
          {canManage && tab === 'sales' && (
            <button className="btn btn-primary" onClick={() => setSaleModal(true)}><ShoppingCart size={16} /> New Sale</button>
          )}
        </div>
      </div>

      {tab === 'stock' && (
        <div className="datatable-card">
          <div className="datatable-scroll">
            <table className="datatable">
              <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Expiry</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="datatable-empty">Loading...</td></tr>}
                {!loading && medicines.map((m) => {
                  const low = m.stockQuantity <= m.reorderLevel;
                  return (
                    <tr key={m._id}>
                      <td>{m.name} <span className="text-meta">{m.brand}</span></td>
                      <td>{m.category || '—'}</td>
                      <td>₹{m.price}</td>
                      <td>{m.stockQuantity} {m.unit}</td>
                      <td>{low
                        ? <span className="badge badge-red"><AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />Low stock</span>
                        : <span className="badge badge-green">In stock</span>}
                      </td>
                      <td>{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="datatable-card">
          <div className="datatable-scroll">
            <table className="datatable">
              <thead><tr><th>Patient</th><th>Items</th><th>Total</th><th>Sold By</th><th>Date</th><th>Payment</th></tr></thead>
              <tbody>
                {sales.length === 0 && <tr><td colSpan={6} className="datatable-empty">No sales recorded yet.</td></tr>}
                {sales.map((s) => (
                  <tr key={s._id}>
                    <td>{s.patient?.name || 'Walk-in'}</td>
                    <td>{s.items.map((it) => `${it.medicine?.name} x${it.quantity}`).join(', ')}</td>
                    <td>₹{s.totalAmount}</td>
                    <td>{s.soldBy?.name}</td>
                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${s.paymentStatus === 'paid' ? 'badge-green' : 'badge-amber'}`}>{s.paymentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {medModal && (
        <div className="modal-overlay" onClick={() => setMedModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">Add Medicine</h2></div>
            <form onSubmit={handleAddMedicine}>
              <div className="modal-body">
                {err && <div className="login-error">{err}</div>}
                <div className="form-field"><label>Name *</label><input required value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} /></div>
                <div className="form-field"><label>Category</label><input value={medForm.category} onChange={(e) => setMedForm({ ...medForm, category: e.target.value })} /></div>
                <div className="form-field"><label>Brand</label><input value={medForm.brand} onChange={(e) => setMedForm({ ...medForm, brand: e.target.value })} /></div>
                <div className="form-field"><label>Price *</label><input type="number" required value={medForm.price} onChange={(e) => setMedForm({ ...medForm, price: Number(e.target.value) })} /></div>
                <div className="form-field"><label>Stock Quantity *</label><input type="number" required value={medForm.stockQuantity} onChange={(e) => setMedForm({ ...medForm, stockQuantity: Number(e.target.value) })} /></div>
                <div className="form-field"><label>Reorder Level</label><input type="number" value={medForm.reorderLevel} onChange={(e) => setMedForm({ ...medForm, reorderLevel: Number(e.target.value) })} /></div>
                <div className="form-field"><label>Expiry Date</label><input type="date" value={medForm.expiryDate} onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setMedModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {saleModal && (
        <div className="modal-overlay" onClick={() => setSaleModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">New Pharmacy Sale</h2></div>
            <form onSubmit={handleSale}>
              <div className="modal-body">
                {err && <div className="login-error">{err}</div>}
                <div className="form-field">
                  <label>Patient</label>
                  <select value={saleForm.patient} onChange={(e) => setSaleForm({ ...saleForm, patient: e.target.value })}>
                    <option value="">Walk-in customer</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>

                {saleForm.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
                    <div className="form-field" style={{ flex: 2, marginBottom: 0 }}>
                      <label>Medicine</label>
                      <select value={it.medicine} onChange={(e) => updateSaleItem(idx, 'medicine', e.target.value)} required>
                        <option value="">Select...</option>
                        {medicines.map((m) => <option key={m._id} value={m._id}>{m.name} (₹{m.price}, {m.stockQuantity} left)</option>)}
                      </select>
                    </div>
                    <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Qty</label>
                      <input type="number" min="1" value={it.quantity} onChange={(e) => updateSaleItem(idx, 'quantity', Number(e.target.value))} required />
                    </div>
                    <button type="button" className="icon-btn danger" onClick={() => removeSaleItem(idx)}><Trash2 size={16} /></button>
                  </div>
                ))}

                <button type="button" className="btn btn-secondary" onClick={addSaleItem} style={{ marginBottom: 12 }}>
                  <Plus size={14} /> Add Item
                </button>

                <div className="text-section-title" style={{ textAlign: 'right' }}>Total: ₹{saleTotal}</div>
              </div>
              <div className="modal-footer">
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
