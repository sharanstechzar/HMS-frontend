import { useState, useEffect, useCallback } from 'react';
import { Users as UsersIcon, Shield, Power, PowerOff } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import FormModal from '../components/common/FormModal';
import useCrud from '../hooks/useCrud';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ADMIN, EXPORT_ROLES } from '../config/modules';

const ROLE_LABEL = (name) => (name || '').replace(/_/g, ' ');

export default function UsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [toast, setToast] = useState('');

  const endpoint = '/users';
  const { rows, setRows, loading, error, create, remove } = useCrud(endpoint, { search });

  const canWrite = ADMIN.includes(user.role);
  const canExport = EXPORT_ROLES.includes(user.role);

  const loadRoles = useCallback(async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data.data || []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const roleNames = roles.map((r) => r.name);

  const createFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'text', required: true },
    { name: 'password', label: 'Password', type: 'text', required: true },
    { name: 'role', label: 'Role', type: 'select', options: roleNames, required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
    { name: 'department', label: 'Department', type: 'reference', refEndpoint: '/departments', refLabel: 'name' },
    { name: 'designation', label: 'Designation', type: 'text' },
  ];

  // Role is intentionally excluded here - it's changed via the dedicated
  // "Change role" action (PUT /users/:id/role) so the backend can log and
  // guardrail it separately from a routine profile edit.
  const editFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'text', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
    { name: 'department', label: 'Department', type: 'reference', refEndpoint: '/departments', refLabel: 'name' },
    { name: 'designation', label: 'Designation', type: 'text' },
  ];

  const roleChangeFields = [
    { name: 'role', label: 'Role', type: 'select', options: roleNames, required: true },
  ];

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className="inline-flex px-2.5 py-1 rounded-full text-[13px] font-medium bg-primary-light text-primary-dark capitalize">
          {ROLE_LABEL(row.role)}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${row.isActive ? 'text-success' : 'text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.isActive ? 'bg-success' : 'bg-slate-400'}`} />
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        const { data } = await api.put(`${endpoint}/${editing._id}`, values);
        setRows((r) => r.map((row) => (row._id === editing._id ? data.data : row)));
        showToast('User updated successfully');
      } else {
        await create(values);
        showToast('User created successfully');
      }
      setModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      await remove(row._id);
      showToast('User deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRoleChange = async (values) => {
    try {
      const { data } = await api.put(`${endpoint}/${roleModalUser._id}/role`, values);
      setRows((r) => r.map((row) => (row._id === roleModalUser._id ? data.data : row)));
      setRoleModalUser(null);
      showToast(`Role updated to ${ROLE_LABEL(values.role)}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not change role');
    }
  };

  const toggleActive = async (row) => {
    const action = row.isActive ? 'deactivate' : 'activate';
    if (row.isActive && !window.confirm(`Deactivate ${row.name}? They will no longer be able to log in.`)) return;
    try {
      const { data } = await api.put(`${endpoint}/${row._id}/${action}`);
      setRows((r) => r.map((rr) => (rr._id === row._id ? data.data : rr)));
      showToast(row.isActive ? 'User deactivated' : 'User activated');
    } catch (err) {
      alert(err.response?.data?.message || `Could not ${action} user`);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 md:p-8">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-success text-white px-5 py-3 rounded-md shadow-md font-medium z-50">
          {toast}
        </div>
      )}

      {error && (
        <div className="bg-danger-light border border-red-200 text-danger px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-page-title flex items-center gap-3">
          <div className="p-2.5 bg-primary-light text-primary-dark rounded-lg">
            <UsersIcon size={22} strokeWidth={2.2} />
          </div>
          User Accounts
        </h1>
        <p className="text-body text-slate-500 mt-1.5">Manage staff logins, roles and account status.</p>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        search={search}
        onSearch={setSearch}
        onAdd={canWrite ? handleAdd : undefined}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canWrite={canWrite}
        canExport={canExport}
        onExport={async () => {
          const res = await api.get(`${endpoint}/export/csv`, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.download = 'users-export.csv';
          document.body.appendChild(link);
          link.click();
          link.remove();
        }}
        emptyLabel="No users found."
        renderRowActions={(row) =>
          canWrite && (
            <>
              <button className="icon-btn" onClick={() => setRoleModalUser(row)} title="Change role">
                <Shield size={16} />
              </button>
              <button
                className={`icon-btn ${row.isActive ? 'danger' : ''}`}
                onClick={() => toggleActive(row)}
                title={row.isActive ? 'Deactivate' : 'Activate'}
              >
                {row.isActive ? <PowerOff size={16} /> : <Power size={16} />}
              </button>
            </>
          )
        }
      />

      {modalOpen && (
        <FormModal
          title={editing ? 'Update User' : 'Add New User'}
          fields={editing ? editFields : createFields}
          initialData={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {roleModalUser && (
        <FormModal
          title={`Change role for ${roleModalUser.name}`}
          fields={roleChangeFields}
          initialData={roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onSubmit={handleRoleChange}
          submitLabel="Update Role"
        />
      )}
    </div>
  );
}
