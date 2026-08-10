import { useState, useEffect } from 'react';
import { Plus, Trash2, Wallet, Eye } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BILLING, EXPORT_ROLES } from '../config/modules';
import './Appointments.css';

const CATEGORIES = ['consultation', 'lab', 'pharmacy', 'room', 'surgery', 'other'];

export default function Billing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [form, setForm] = useState({ patient: '', items: [], discount: 0, taxPercent: 0 });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = BILLING.includes(user.role);
  const canExport = EXPORT_ROLES.includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const [i, p] = await Promise.all([
        api.get('/invoices'),
        api.get('/patients', { params: { limit: 200 } }),
      ]);
      setInvoices(i.data.data);
      setPatients(p.data.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { description: '', category: 'other', quantity: 1, unitPrice: 0 }] }));
  const updateItem = (idx, key, value) => setForm((f) => {
    const items = [...f.items];
    items[idx] = { ...items[idx], [key]: value };
    return { ...f, items };
  });
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subTotal = form.items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1), 0);
  const afterDiscount = subTotal - (Number(form.discount) || 0);
  const taxAmt = afterDiscount * ((Number(form.taxPercent) || 0) / 100);
  const grandTotal = afterDiscount + taxAmt;

  const handleCreate = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await api.post('/invoices', form);
      setCreateModal(false);
      setForm({ patient: '', items: [], discount: 0, taxPercent: 0 });
      load();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    await api.put(`/invoices/${payModal._id}/payment`, { amount: Number(payAmount), paymentMode: payMode });
    setPayModal(null);
    setPayAmount('');
    load();
  };

  const exportCsv = async () => {
    const res = await api.get('/invoices/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invoices-export.csv';
    link.click();
  };

  return (
    <div>
      <div className="appt-toolbar">
        <span className="text-meta">{invoices.length} invoices</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {canExport && <button className="btn btn-secondary" onClick={exportCsv}>Export</button>}
          {canManage && <button className="btn btn-primary" onClick={() => setCreateModal(true)}><Plus size={16} /> New Invoice</button>}
        </div>
      </div>

      <div className="datatable-card">
        <div className="datatable-scroll">
          <table className="datatable">
            <thead><tr><th>Invoice #</th><th>Patient</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="datatable-empty">Loading...</td></tr>}
              {!loading && invoices.length === 0 && <tr><td colSpan={7} className="datatable-empty">No invoices yet.</td></tr>}
              {!loading && invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{inv.patient?.name} <span className="text-meta">({inv.patient?.patientId})</span></td>
                  <td>₹{inv.totalAmount}</td>
                  <td>₹{inv.amountPaid}</td>
                  <td>₹{inv.balanceDue}</td>
                  <td><span className={`badge ${inv.status === 'paid' ? 'badge-green' : inv.status === 'partial' ? 'badge-amber' : 'badge-red'}`}>{inv.status}</span></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="icon-btn" title="View" onClick={() => setViewModal(inv)}><Eye size={16} /></button>
                    {canManage && inv.status !== 'paid' && (
                      <button className="icon-btn" title="Record payment" onClick={() => { setPayModal(inv); setPayAmount(inv.balanceDue); }}>
                        <Wallet size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">New Invoice</h2></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {err && <div className="login-error">{err}</div>}
                <div className="form-field">
                  <label>Patient *</label>
                  <select required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>

                {form.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
                    <div className="form-field" style={{ flex: 2, marginBottom: 0 }}>
                      <label>Description</label>
                      <input value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} required />
                    </div>
                    <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Category</label>
                      <select value={it.category} onChange={(e) => updateItem(idx, 'category', e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Qty</label>
                      <input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Unit Price</label>
                      <input type="number" min="0" value={it.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} required />
                    </div>
                    <button type="button" className="icon-btn danger" onClick={() => removeItem(idx)}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={addItem} style={{ marginBottom: 14 }}><Plus size={14} /> Add Line Item</button>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-field" style={{ flex: 1 }}>
                    <label>Discount (₹)</label>
                    <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                  </div>
                  <div className="form-field" style={{ flex: 1 }}>
                    <label>Tax (%)</label>
                    <input type="number" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="text-section-title" style={{ textAlign: 'right', marginTop: 8 }}>
                  Grand Total: ₹{grandTotal.toFixed(2)}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || form.items.length === 0}>{saving ? 'Creating...' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">Record Payment — {payModal.invoiceNumber}</h2></div>
            <form onSubmit={handlePayment}>
              <div className="modal-body">
                <p className="text-meta" style={{ marginBottom: 12 }}>Balance due: ₹{payModal.balanceDue}</p>
                <div className="form-field"><label>Amount *</label><input type="number" required max={payModal.balanceDue} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
                <div className="form-field">
                  <label>Payment Mode</label>
                  <select value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                    <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="insurance">Insurance</option><option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModal && (
        <div className="modal-overlay" onClick={() => setViewModal(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2 className="text-section-title">Invoice {viewModal.invoiceNumber}</h2></div>
            <div className="modal-body">
              <p className="text-body"><strong>Patient:</strong> {viewModal.patient?.name}</p>
              <table className="datatable" style={{ marginTop: 12 }}>
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
                <tbody>
                  {viewModal.items.map((it, idx) => (
                    <tr key={idx}><td>{it.description}</td><td>{it.quantity}</td><td>₹{it.unitPrice}</td><td>₹{it.amount}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 14, textAlign: 'right' }} className="text-body">
                <div>Subtotal: ₹{viewModal.subTotal}</div>
                <div>Discount: ₹{viewModal.discount}</div>
                <div>Tax: ₹{viewModal.taxAmount?.toFixed?.(2) ?? viewModal.taxAmount}</div>
                <div className="text-section-title">Total: ₹{viewModal.totalAmount}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
