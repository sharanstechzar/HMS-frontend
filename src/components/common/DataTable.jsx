import { Pencil, Trash2, Search, Download, Plus } from 'lucide-react';

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object' && value?.name) return value.name; // populated ref like {name: 'Cardiology'}
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

export default function DataTable({
  columns,
  rows,
  onEdit,
  onDelete,
  onAdd,
  onSearch,
  search,
  canWrite = true,
  canExport = false,
  onExport,
  loading,
  emptyLabel = 'No records yet',
  extraActions,
}) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 border-b border-border bg-slate-50/50">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-md w-full md:max-w-xs focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent">
          <Search size={17} className="text-slate-400" />
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="border-none bg-transparent outline-none w-full text-[15px]"
          />
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          {extraActions}
          {canExport && (
            <button className="btn btn-secondary whitespace-nowrap" onClick={onExport}>
              <Download size={16} /> Export
            </button>
          )}
          {canWrite && onAdd && (
            <button className="btn btn-primary whitespace-nowrap" onClick={onAdd}>
              <Plus size={16} /> Add New
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border whitespace-nowrap">{c.label}</th>
              ))}
              {(onEdit || onDelete) && <th className="p-3.5 px-4 font-semibold text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border w-[100px] text-right whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-500 bg-slate-50/30">Loading...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-500 bg-slate-50/30">{emptyLabel}</td></tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row._id} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="p-3.5 px-4 text-[15px] text-slate-800 whitespace-nowrap">{c.render ? c.render(row) : formatCell(row[c.key])}</td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="p-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && canWrite && (
                        <button className="icon-btn" onClick={() => onEdit(row)} title="Edit">
                          <Pencil size={16} />
                        </button>
                      )}
                      {onDelete && canWrite && (
                        <button className="icon-btn danger" onClick={() => onDelete(row)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
