import { useState } from 'react';
import { Scissors, Plus, Search, FileDown } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import FormModal from '../components/common/FormModal';
import useCrud from '../hooks/useCrud';
import { useAuth } from '../context/AuthContext';
import { CLINICAL, EXPORT_ROLES } from '../config/modules';

export default function Surgery() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  const endpoint = '/surgeries';
  const { rows, loading, error, create, update, remove, exportCsv } = useCrud(endpoint, { search });

  const canWrite = CLINICAL.includes(user.role);
  const canExport = EXPORT_ROLES.includes(user.role);

  const fields = [
    { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
    { name: 'surgeon', label: 'Surgeon', type: 'doctor', required: true },
    { name: 'surgeryType', label: 'Surgery Type', type: 'text', required: true },
    { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
    { name: 'operationTheatre', label: 'Operation Theatre', type: 'text' },
    { name: 'operationNotes', label: 'Operation Notes', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
  ];

  const columns = [
    { key: 'surgeryType', label: 'Surgery Type' },
    { key: 'scheduledDate', label: 'Scheduled Date' },
    { key: 'operationTheatre', label: 'Operation Theatre' },
    { key: 'status', label: 'Status' },
  ];

  const handleAdd = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await update(editing._id, values);
        setToast('Surgery schedule updated successfully');
      } else {
        await create(values);
        setToast('Surgery scheduled successfully');
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
    <div className="flex flex-col h-full bg-slate-50 p-6 md:p-8">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center gap-2 z-50">
          <div className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse"></div>
          {toast}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Scissors size={26} strokeWidth={2.5} />
            </div>
            Surgery Schedules
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage operations, theatres, and surgical workflows.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search surgeries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          {canExport && (
            <button onClick={exportCsv} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-medium">
              <FileDown size={20} />
              Export
            </button>
          )}
          {canWrite && (
            <button onClick={handleAdd} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 font-medium">
              <Plus size={20} />
              Schedule Surgery
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canWrite={canWrite}
          emptyLabel="No surgeries scheduled."
        />
      </div>

      {modalOpen && (
        <FormModal
          title={editing ? "Update Surgery" : "Schedule Surgery"}
          fields={fields}
          initialData={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
