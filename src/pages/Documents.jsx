import { useState, useEffect } from 'react';
import { Upload, FileText } from 'lucide-react';
import api from '../api/axios';
import './Appointments.css';

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
    <div>
      <p className="text-meta" style={{ marginBottom: 16 }}>
        Scan reports, X-rays, prescriptions, insurance documents and consent forms — stored against the patient record.
      </p>

      <div className="datatable-card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 className="text-section-title" style={{ marginBottom: 14 }}>Upload a Document</h3>
        {msg && <div className="page-toast" style={{ position: 'static', marginBottom: 12 }}>{msg}</div>}
        <form onSubmit={handleUpload}>
          <div className="form-field">
            <label>Patient *</label>
            <select required value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select patient...</option>
              {patients.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Document Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chest X-Ray, Consent Form" />
          </div>
          <div className="form-field">
            <label>File *</label>
            <input type="file" onChange={handleFile} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving || !selected || !fileUrl}>
            <Upload size={16} /> {saving ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {patient && (
        <div className="datatable-card">
          <div className="datatable-scroll">
            <table className="datatable">
              <thead><tr><th>Title</th><th>Uploaded</th><th>View</th></tr></thead>
              <tbody>
                {(!patient.documents || patient.documents.length === 0) && (
                  <tr><td colSpan={3} className="datatable-empty">No documents uploaded for this patient yet.</td></tr>
                )}
                {patient.documents?.map((d, idx) => (
                  <tr key={idx}>
                    <td><FileText size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />{d.title}</td>
                    <td>{new Date(d.uploadedAt).toLocaleDateString()}</td>
                    <td><a href={d.fileUrl} target="_blank" rel="noreferrer">Open</a></td>
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
