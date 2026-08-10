import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';

export default function FormModal({ title, fields, initialData, onClose, onSubmit, submitLabel = 'Save' }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [refOptions, setRefOptions] = useState({});

  useEffect(() => {
    const fetchReferences = async () => {
      const options = {};
      for (const f of fields) {
        if (f.type === 'reference' && f.refEndpoint) {
          try {
            const res = await api.get(f.refEndpoint);
            // Assuming standard response wraps in "data" or is the array itself
            options[f.name] = res.data.data || res.data || [];
          } catch (err) {
            console.error(`Failed to load reference for ${f.name}`, err);
            options[f.name] = [];
          }
        }
      }
      setRefOptions(options);
    };
    fetchReferences();
  }, [fields]);

  useEffect(() => {
    const initial = {};
    fields.forEach((f) => {
      initial[f.name] = initialData?.[f.name] ?? (f.type === 'checkbox' ? false : '');
    });
    setValues(initial);
  }, [initialData, fields]);

  const handleChange = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    fields.forEach((f) => {
      if (f.required && (values[f.name] === '' || values[f.name] === undefined || values[f.name] === null)) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 md:px-5 border-b border-border">
          <h2 className="text-section-title">{title}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 md:px-5 overflow-y-auto flex flex-col gap-4">
            {fields.map((f) => (
              <div className="flex flex-col gap-1.5" key={f.name}>
                <label className="text-[13px] font-semibold text-slate-500">
                  {f.label}
                  {f.required && <span className="text-red-600 ml-1">*</span>}
                </label>

                {f.type === 'textarea' && (
                  <textarea
                    rows={3}
                    className="p-2.5 px-3 border border-border rounded-md text-[15px] text-slate-900 bg-surface w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    value={values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                  />
                )}

                {f.type === 'select' && (
                  <select
                    className="p-2.5 px-3 border border-border rounded-md text-[15px] text-slate-900 bg-surface w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    value={values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                )}

                {f.type === 'reference' && (
                  <select
                    className="p-2.5 px-3 border border-border rounded-md text-[15px] text-slate-900 bg-surface w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    value={values[f.name]?._id || values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                  >
                    <option value="">Select {f.label}...</option>
                    {(refOptions[f.name] || []).map((opt) => {
                      const labelPath = f.refLabel || 'name';
                      const label = labelPath.split('.').reduce((o, i) => o?.[i], opt) || opt._id;
                      return <option key={opt._id} value={opt._id}>{label}</option>;
                    })}
                  </select>
                )}

                {f.type === 'checkbox' && (
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-accent"
                    checked={!!values[f.name]}
                    onChange={(e) => handleChange(f.name, e.target.checked)}
                  />
                )}

                {['text', 'number', 'date'].includes(f.type) && (
                  <input
                    type={f.type}
                    className="p-2.5 px-3 border border-border rounded-md text-[15px] text-slate-900 bg-surface w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    value={values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  />
                )}

                {f.hint && <span className="text-meta">{f.hint}</span>}
                {errors[f.name] && <span className="text-[13px] text-red-600">{errors[f.name]}</span>}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 p-4 md:px-5 border-t border-border mt-auto">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
