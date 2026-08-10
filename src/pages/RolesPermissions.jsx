import { useState, useEffect, useCallback, useMemo } from 'react';
import { KeyRound, Plus, Trash2, Save, RotateCcw, Lock, ShieldAlert } from 'lucide-react';
import FormModal from '../components/common/FormModal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  process: 'Process',
  update: 'Update',
  complete: 'Complete',
  admin: 'Admin',
};

export default function RolesPermissions() {
  const { user } = useAuth();
  const isSuperAdmin = user.role === 'super_admin';

  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({ modules: [], actions: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [working, setWorking] = useState(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, catalogRes] = await Promise.all([api.get('/roles'), api.get('/roles/catalog')]);
      setRoles(rolesRes.data.data || []);
      setCatalog(catalogRes.data.data || { modules: [], actions: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedId && roles.length) setSelectedId(roles[0]._id);
  }, [roles, selectedId]);

  const selectedRole = useMemo(() => roles.find((r) => r._id === selectedId), [roles, selectedId]);

  useEffect(() => {
    if (selectedRole) {
      setWorking(new Set(selectedRole.permissions || []));
      setDirty(false);
    }
  }, [selectedRole]);

  const canEditMatrix = isSuperAdmin && !!selectedRole;

  const toggleCell = (moduleKey, action) => {
    if (!canEditMatrix) return;
    const key = `${moduleKey}:${action}`;
    setWorking((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
  };

  const toggleRow = (moduleKey) => {
    if (!canEditMatrix) return;
    const keys = catalog.actions.map((a) => `${moduleKey}:${a}`);
    const allOn = keys.every((k) => working.has(k));
    setWorking((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
    setDirty(true);
  };

  const toggleColumn = (action) => {
    if (!canEditMatrix) return;
    const keys = catalog.modules.map((m) => `${m.key}:${action}`);
    const allOn = keys.every((k) => working.has(k));
    setWorking((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/roles/${selectedRole._id}`, { permissions: Array.from(working) });
      setRoles((r) => r.map((role) => (role._id === selectedRole._id ? data.data : role)));
      setDirty(false);
      showToast(`Permissions saved for ${data.data.label}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setWorking(new Set(selectedRole.permissions || []));
    setDirty(false);
  };

  const handleCreate = async (values) => {
    try {
      const { data } = await api.post('/roles', { ...values, permissions: [] });
      setRoles((r) => [...r, data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedId(data.data._id);
      setCreateOpen(false);
      showToast(`Role '${data.data.label}' created - now set its permissions`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create role');
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role '${role.label}'? This only works if no user currently holds it.`)) return;
    try {
      await api.delete(`/roles/${role._id}`);
      setRoles((r) => r.filter((x) => x._id !== role._id));
      if (selectedId === role._id) setSelectedId(null);
      showToast('Role deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete role');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading roles...</div>;
  }

  return (
    <div className="flex flex-col h-full p-6 md:p-8">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-success text-white px-5 py-3 rounded-md shadow-md font-medium z-50">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page-title flex items-center gap-3">
            <div className="p-2.5 bg-primary-light text-primary-dark rounded-lg">
              <KeyRound size={22} strokeWidth={2.2} />
            </div>
            Roles &amp; Permissions
          </h1>
          <p className="text-body text-slate-500 mt-1.5">
            Control what each role can view, create, process, update or complete across every module.
          </p>
        </div>
        {isSuperAdmin && (
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New Role
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-md mb-5 text-[15px]">
          <ShieldAlert size={17} />
          Only Super Admin can edit role permissions. You have read-only access.
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* Role list */}
        <div className="lg:w-64 flex-shrink-0 bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 px-4 border-b border-border bg-slate-50/50 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
            Roles ({roles.length})
          </div>
          <div className="overflow-y-auto">
            {roles.map((role) => (
              <button
                key={role._id}
                onClick={() => setSelectedId(role._id)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 transition-colors ${
                  selectedId === role._id ? 'bg-primary-light' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[15px] font-medium capitalize ${selectedId === role._id ? 'text-primary-dark' : 'text-slate-800'}`}>
                    {role.label}
                  </span>
                  {role.isSystem && <Lock size={13} className="text-slate-400 flex-shrink-0" />}
                </div>
                <span className="text-[13px] text-slate-500">{role.permissions?.length || 0} permissions</span>
              </button>
            ))}
          </div>
        </div>

        {/* Permission matrix */}
        <div className="flex-1 bg-surface border border-border rounded-xl overflow-hidden flex flex-col min-h-0">
          {!selectedRole ? (
            <div className="p-8 text-center text-slate-500">Select a role to view its permissions.</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-slate-50/50">
                <div>
                  <h2 className="text-section-title capitalize">{selectedRole.label}</h2>
                  {selectedRole.description && <p className="text-meta mt-0.5">{selectedRole.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSuperAdmin && !selectedRole.isSystem && (
                    <button className="icon-btn danger" title="Delete role" onClick={() => handleDelete(selectedRole)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                  {dirty && (
                    <>
                      <button className="btn btn-secondary" onClick={handleDiscard}>
                        <RotateCcw size={15} /> Discard
                      </button>
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border sticky left-0 bg-slate-50 z-10">
                        Module
                      </th>
                      {catalog.actions.map((action) => (
                        <th
                          key={action}
                          className={`p-3 px-3 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border text-center whitespace-nowrap ${canEditMatrix ? 'cursor-pointer hover:text-primary' : ''}`}
                          onClick={() => toggleColumn(action)}
                          title={canEditMatrix ? `Toggle ${ACTION_LABELS[action]} for every module` : undefined}
                        >
                          {ACTION_LABELS[action] || action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.modules.map((m) => (
                      <tr key={m.key} className="border-b border-border hover:bg-slate-50/50">
                        <td
                          className={`p-3 px-4 text-[15px] text-slate-800 font-medium whitespace-nowrap sticky left-0 bg-surface ${canEditMatrix ? 'cursor-pointer hover:text-primary' : ''}`}
                          onClick={() => toggleRow(m.key)}
                          title={canEditMatrix ? `Toggle every action for ${m.label}` : undefined}
                        >
                          {m.label}
                        </td>
                        {catalog.actions.map((action) => {
                          const key = `${m.key}:${action}`;
                          return (
                            <td key={action} className="p-3 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-primary disabled:opacity-40"
                                checked={working.has(key)}
                                disabled={!canEditMatrix}
                                onChange={() => toggleCell(m.key, action)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {createOpen && (
        <FormModal
          title="New Role"
          fields={[
            { name: 'name', label: 'Role Key', type: 'text', required: true, hint: 'Lowercase, used internally e.g. "ward_boy"' },
            { name: 'label', label: 'Display Label', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
          ]}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
          submitLabel="Create Role"
        />
      )}
    </div>
  );
}
