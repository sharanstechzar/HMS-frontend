import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './FormModal.css';

export default function FormModal({ title, fields, initialData, onClose, onSubmit, submitLabel = 'Save' }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-section-title">{title}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((f) => (
              <div className="form-field" key={f.name}>
                <label>{f.label}{f.required && <span className="required">*</span>}</label>

                {f.type === 'textarea' && (
                  <textarea
                    rows={3}
                    value={values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                  />
                )}

                {f.type === 'select' && (
                  <select
                    value={values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                )}

                {f.type === 'checkbox' && (
                  <input
                    type="checkbox"
                    checked={!!values[f.name]}
                    onChange={(e) => handleChange(f.name, e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                )}

                {['text', 'number', 'date'].includes(f.type) && (
                  <input
                    type={f.type}
                    value={values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                  />
                )}

                {f.hint && <span className="text-meta">{f.hint}</span>}
                {errors[f.name] && <span className="field-error">{errors[f.name]}</span>}
              </div>
            ))}
          </div>

          <div className="modal-footer">
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
