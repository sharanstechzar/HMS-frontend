import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';

export default function FormModal({ title, fields, initialData, onClose, onSubmit, submitLabel = 'Save' }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [refOptions, setRefOptions] = useState({});
  const [doctorDept, setDoctorDept] = useState({}); // per-field selected department, for type:'doctor' fields only

  useEffect(() => {
    const fetchReferences = async () => {
      const options = {};
      for (const f of fields) {
        if (f.type === 'reference' && f.refEndpoint) {
          try {
            const res = await api.get(f.refEndpoint, f.refParams ? { params: f.refParams } : undefined);
            // Assuming standard response wraps in "data" or is the array itself
            options[f.name] = res.data.data || res.data || [];
          } catch (err) {
            console.error(`Failed to load reference for ${f.name}`, err);
            options[f.name] = [];
          }
        }
        if (f.type === 'doctor') {
          try {
            const [deptRes, docRes] = await Promise.all([
              api.get('/departments'),
              api.get('/doctors', { params: { limit: 500 } }),
            ]);
            options[f.name] = { departments: deptRes.data.data || [], doctors: docRes.data.data || [] };
          } catch (err) {
            console.error(`Failed to load doctors for ${f.name}`, err);
            options[f.name] = { departments: [], doctors: [] };
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
      const emptyDefault = f.type === 'checkbox' ? false : f.type === 'array' || f.type === 'checkboxGroup' ? [] : '';
      initial[f.name] = initialData?.[f.name] ?? emptyDefault;
    });
    setValues(initial);
  }, [initialData, fields]);

  // When editing an existing record, derive which department each
  // type:'doctor' field's doctor belongs to, so both selects start populated.
  useEffect(() => {
    const deptByField = {};
    fields.forEach((f) => {
      if (f.type !== 'doctor') return;
      const current = initialData?.[f.name];
      const doctorId = current?._id || current;
      const match = (refOptions[f.name]?.doctors || []).find((d) => d._id === doctorId);
      if (match) deptByField[f.name] = match.department?._id || match.department || '';
    });
    if (Object.keys(deptByField).length) setDoctorDept((prev) => ({ ...prev, ...deptByField }));
  }, [initialData, fields, refOptions]);

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

                {f.type === 'doctor' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      className="p-2.5 px-3 border border-border rounded-md text-[14px] text-slate-900 bg-surface w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      value={doctorDept[f.name] || ''}
                      onChange={(e) => {
                        setDoctorDept((prev) => ({ ...prev, [f.name]: e.target.value }));
                        handleChange(f.name, ''); // previously picked doctor may not belong to the new department
                      }}
                    >
                      <option value="">Department...</option>
                      {(refOptions[f.name]?.departments || []).map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                    <select
                      className="p-2.5 px-3 border border-border rounded-md text-[14px] text-slate-900 bg-surface w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                      value={values[f.name]?._id || values[f.name] || ''}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      disabled={!doctorDept[f.name]}
                    >
                      <option value="">
                        {!doctorDept[f.name]
                          ? 'Select department first'
                          : (refOptions[f.name]?.doctors || []).some((d) => (d.department?._id || d.department) === doctorDept[f.name])
                            ? 'Doctor...'
                            : 'No doctors in this department'}
                      </option>
                      {(refOptions[f.name]?.doctors || [])
                        .filter((d) => (d.department?._id || d.department) === doctorDept[f.name])
                        .map((d) => (
                          <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                {f.type === 'checkbox' && (
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-accent"
                    checked={!!values[f.name]}
                    onChange={(e) => handleChange(f.name, e.target.checked)}
                  />
                )}

                {f.type === 'time' && (
                  <input
                    type="time"
                    className="p-2.5 px-3 border border-border rounded-md text-[15px] text-slate-900 bg-surface w-full focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    value={values[f.name] || ''}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                  />
                )}

                {f.type === 'checkboxGroup' && (
                  <div className="flex flex-wrap gap-1.5">
                    {f.options.map((opt) => {
                      const selected = (values[f.name] || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const current = values[f.name] || [];
                            handleChange(f.name, selected ? current.filter((o) => o !== opt) : [...current, opt]);
                          }}
                          className={`px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
                            selected ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-border hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {f.type === 'array' && (
                  <div className="flex flex-col gap-2">
                    {(values[f.name] || []).map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-2.5 border border-border rounded-md bg-slate-50/50">
                        {f.itemFields.map((itemField) => (
                          <div key={itemField.name} className="flex flex-col gap-1 flex-1">
                            <label className="text-[11px] font-medium text-slate-500">{itemField.label}</label>
                            <input
                              type={itemField.type === 'date' ? 'date' : 'text'}
                              className="p-2 px-2.5 border border-border rounded-md text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                              value={item[itemField.name] ? (itemField.type === 'date' ? String(item[itemField.name]).slice(0, 10) : item[itemField.name]) : ''}
                              onChange={(e) => {
                                const arr = [...(values[f.name] || [])];
                                arr[idx] = { ...arr[idx], [itemField.name]: e.target.value };
                                handleChange(f.name, arr);
                              }}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => handleChange(f.name, (values[f.name] || []).filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary self-start"
                      onClick={() => {
                        const blank = {};
                        f.itemFields.forEach((itemField) => (blank[itemField.name] = ''));
                        handleChange(f.name, [...(values[f.name] || []), blank]);
                      }}
                    >
                      <Plus size={14} /> Add {f.label.replace(/s$/, '')}
                    </button>
                  </div>
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
