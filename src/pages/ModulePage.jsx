import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from '../components/common/DataTable';
import FormModal from '../components/common/FormModal';
import useCrud from '../hooks/useCrud';
import { getModuleByPath, EXPORT_ROLES } from '../config/modules';
import { useAuth } from '../context/AuthContext';

export default function ModulePage() {
  const location = useLocation();
  const mod = getModuleByPath(location.pathname);
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  const { rows, loading, error, load, create, update, remove, exportCsv } = useCrud(mod.endpoint, { search });

  const canWrite = (mod.writeRoles || mod.roles).includes(user.role);
  const canExport = EXPORT_ROLES.includes(user.role);

  const columns = (mod.columns || mod.fields.map((f) => f.name)).map((key) => {
    const fieldDef = mod.fields.find((f) => f.name === key);
    return { key, label: fieldDef?.label || key.charAt(0).toUpperCase() + key.slice(1) };
  });

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await update(editing._id, values);
        setToast(`${mod.label.replace(/s$/, '')} updated successfully`);
      } else {
        await create(values);
        setToast(`${mod.label.replace(/s$/, '')} added successfully`);
      }
      setModalOpen(false);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await remove(row._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      {toast && <div className="page-toast">{toast}</div>}
      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        search={search}
        onSearch={setSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canWrite={canWrite}
        canExport={canExport}
        onExport={exportCsv}
        emptyLabel={`No ${mod.label.toLowerCase()} records yet. Click "Add New" to create one.`}
      />

      {modalOpen && (
        <FormModal
          title={editing ? `Edit ${mod.label.replace(/s$/, '')}` : `Add ${mod.label.replace(/s$/, '')}`}
          fields={mod.fields}
          initialData={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
