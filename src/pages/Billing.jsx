import { useState, useEffect } from 'react';
import { Plus, Trash2, Wallet, Eye, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { BILLING, EXPORT_ROLES } from '../config/modules';

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
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
        <span className="text-meta font-medium">{invoices.length} invoices</span>
        <div className="flex gap-3 w-full sm:w-auto">
          {canExport && <button className="flex-1 sm:flex-none btn btn-secondary bg-white" onClick={exportCsv}>Export</button>}
          {canManage && <button className="flex-1 sm:flex-none btn btn-primary" onClick={() => setCreateModal(true)}><Plus size={16} /> New Invoice</button>}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {['Invoice #', 'Patient', 'Total', 'Paid', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="p-8 text-center text-slate-500 text-[14px]">Loading...</td></tr>}
              {!loading && invoices.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500 text-[14px]">No invoices yet.</td></tr>}
              {!loading && invoices.map((inv) => (
                <tr key={inv._id} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                  <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{inv.invoiceNumber}</td>
                  <td className="p-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{inv.patient?.name} <span className="text-slate-500 text-[13px] font-normal ml-1">({inv.patient?.patientId})</span></td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">₹{inv.totalAmount}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">₹{inv.amountPaid}</td>
                  <td className="p-3.5 px-4 text-slate-600 whitespace-nowrap">₹{inv.balanceDue}</td>
                  <td className="p-3.5 px-4 whitespace-nowrap">
                    <Badge tone={inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'red'}>{inv.status}</Badge>
                  </td>
                  <td className="p-3.5 px-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-md transition-colors" title="View" onClick={() => setViewModal(inv)}><Eye size={18} /></button>
                      {canManage && inv.status !== 'paid' && (
                        <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Record payment" onClick={() => { setPayModal(inv); setPayAmount(inv.balanceDue); }}>
                          <Wallet size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setCreateModal(false)}>
          <div className="bg-surface rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">New Invoice</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setCreateModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
                {err && <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-[14px]">{err}</div>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Patient *</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
                  </select>
                </div>

                <div className="h-px bg-border my-1"></div>

                {form.items.map((it, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-end p-3 border border-border rounded-lg bg-slate-50/50">
                    <div className="flex flex-col gap-1.5 flex-[2] min-w-[200px]">
                      <label className="text-[13px] font-semibold text-slate-500">Description</label>
                      <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                      <label className="text-[13px] font-semibold text-slate-500">Category</label>
                      <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={it.category} onChange={(e) => updateItem(idx, 'category', e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 w-24">
                      <label className="text-[13px] font-semibold text-slate-500">Qty</label>
                      <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[100px]">
                      <label className="text-[13px] font-semibold text-slate-500">Unit Price</label>
                      <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" min="0" value={it.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} required />
                    </div>
                    <button type="button" className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" onClick={() => removeItem(idx)}><Trash2 size={20} /></button>
                  </div>
                ))}
                
                <button type="button" className="btn btn-secondary self-start" onClick={addItem}><Plus size={16} /> Add Line Item</button>

                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[13px] font-semibold text-slate-500">Discount (₹)</label>
                    <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[13px] font-semibold text-slate-500">Tax (%)</label>
                    <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="text-[18px] font-semibold text-slate-800 self-end mt-2">
                  Grand Total: ₹{grandTotal.toFixed(2)}
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || form.items.length === 0}>{saving ? 'Creating...' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setPayModal(null)}>
          <div className="bg-surface rounded-xl w-full max-w-sm shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
              <h2 className="text-[18px] font-semibold text-slate-800">Record Payment</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setPayModal(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handlePayment}>
              <div className="p-4 md:px-5 flex flex-col gap-4">
                <p className="text-[14px] text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border border-border">Balance due: <span className="font-semibold text-slate-800">₹{payModal.balanceDue}</span></p>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Amount *</label>
                  <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" type="number" required max={payModal.balanceDue} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-slate-500">Payment Mode</label>
                  <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                    <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="insurance">Insurance</option><option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border">
                <button type="button" className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setViewModal(null)}>
          <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:px-5 border-b border-border bg-slate-50">
              <h2 className="text-[18px] font-semibold text-slate-800">Invoice {viewModal.invoiceNumber}</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md" onClick={() => setViewModal(null)}><X size={20} /></button>
            </div>
            
            <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-6">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
                <p className="text-[15px] text-slate-700"><strong className="text-slate-800 mr-2">Patient:</strong> {viewModal.patient?.name}</p>
              </div>
              
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      {['Item', 'Qty', 'Unit Price', 'Amount'].map(h => (
                        <th key={h} className="p-3 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewModal.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-border last:border-b-0">
                        <td className="p-3 px-4 text-[14px] text-slate-700">{it.description}</td>
                        <td className="p-3 px-4 text-[14px] text-slate-700">{it.quantity}</td>
                        <td className="p-3 px-4 text-[14px] text-slate-700">₹{it.unitPrice}</td>
                        <td className="p-3 px-4 text-[14px] font-medium text-slate-800">₹{it.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="self-end w-full max-w-xs flex flex-col gap-2 text-[14px] text-slate-600 bg-slate-50 p-4 rounded-lg border border-border">
                <div className="flex justify-between"><span>Subtotal:</span> <span className="font-medium text-slate-800">₹{viewModal.subTotal}</span></div>
                <div className="flex justify-between"><span>Discount:</span> <span className="font-medium text-slate-800">₹{viewModal.discount}</span></div>
                <div className="flex justify-between"><span>Tax:</span> <span className="font-medium text-slate-800">₹{viewModal.taxAmount?.toFixed?.(2) ?? viewModal.taxAmount}</span></div>
                <div className="h-px bg-border my-1"></div>
                <div className="flex justify-between text-[16px] font-bold text-slate-800"><span>Total:</span> <span>₹{viewModal.totalAmount}</span></div>
              </div>
            </div>
            
            <div className="flex justify-end p-4 md:px-5 border-t border-border mt-auto">
              <button className="btn btn-secondary" onClick={() => setViewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
