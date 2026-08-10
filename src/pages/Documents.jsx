import { useState, useEffect } from 'react';
import { Upload, FileText } from 'lucide-react';
import api from '../api/axios';

export default function Documents() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState('');
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/patients', { params: { limit: 200 } }).then((r) => setPatients(r.data.data));
  }, []);

  const patient = patients.find((p) => p._id === selected);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!title) setTitle(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selected || !fileUrl) return;
    setSaving(true);
    try {
      const newDocs = [...(patient.documents || []), { title, fileUrl }];
      await api.put(`/patients/${selected}`, { documents: newDocs });
      const { data } = await api.get('/patients', { params: { limit: 200 } });
      setPatients(data.data);
      setTitle('');
      setFileUrl('');
      setMsg('Document uploaded successfully');
      setTimeout(() => setMsg(''), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <p className="text-meta text-[14px]">
        Scan reports, X-rays, prescriptions, insurance documents and consent forms — stored against the patient record.
      </p>

      <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex flex-col max-w-2xl">
        <h3 className="text-[16px] font-semibold text-slate-800 mb-4">Upload a Document</h3>
        {msg && <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-200 text-[14px] mb-4">{msg}</div>}
        
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Patient *</label>
            <select className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" required value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select patient...</option>
              {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">Document Title</label>
            <input className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chest X-Ray, Consent Form" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-500">File *</label>
            <input className="p-2 border border-border rounded-md text-[14px] bg-white text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 cursor-pointer" type="file" onChange={handleFile} required />
          </div>
          
          <button type="submit" className="btn btn-primary self-start mt-2" disabled={saving || !selected || !fileUrl}>
            <Upload size={16} /> {saving ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {patient && (
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden mt-2">
          <div className="p-4 border-b border-border bg-slate-50/50">
            <h3 className="text-[16px] font-semibold text-slate-800">Documents for {patient.name}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border">Title</th>
                  <th className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border w-48">Uploaded</th>
                  <th className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {(!patient.documents || patient.documents.length === 0) && (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-500 text-[14px]">No documents uploaded for this patient yet.</td></tr>
                )}
                {patient.documents?.map((d, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-slate-50/50 transition-colors last:border-b-0">
                    <td className="p-3.5 px-4 font-medium text-slate-800 flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      {d.title}
                    </td>
                    <td className="p-3.5 px-4 text-slate-600">{new Date(d.uploadedAt).toLocaleDateString()}</td>
                    <td className="p-3.5 px-4">
                      <a className="text-primary font-medium hover:underline text-[14px]" href={d.fileUrl} target="_blank" rel="noreferrer">Open</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
