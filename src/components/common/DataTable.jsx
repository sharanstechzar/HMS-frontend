import { Pencil, Trash2, Search, Download, Plus } from 'lucide-react';
import './DataTable.css';

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
    <div className="datatable-card">
      <div className="datatable-toolbar">
        <div className="datatable-search">
          <Search size={17} />
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="datatable-actions">
          {extraActions}
          {canExport && (
            <button className="btn btn-secondary" onClick={onExport}>
              <Download size={16} /> Export
            </button>
          )}
          {canWrite && onAdd && (
            <button className="btn btn-primary" onClick={onAdd}>
              <Plus size={16} /> Add New
            </button>
          )}
        </div>
      </div>

      <div className="datatable-scroll">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {(onEdit || onDelete) && <th className="col-actions">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length + 1} className="datatable-empty">Loading...</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="datatable-empty">{emptyLabel}</td></tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row._id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : formatCell(row[c.key])}</td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="col-actions">
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
