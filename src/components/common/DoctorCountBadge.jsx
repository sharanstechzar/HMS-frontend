import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';

// Clickable "N doctors" badge for the Departments table - fetches and shows
// the actual doctors on demand rather than loading everyone's list up front.
export default function DoctorCountBadge({ departmentId, departmentName, count }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState(null); // null = not fetched yet

  const handleOpen = async (e) => {
    e.stopPropagation();
    setOpen(true);
    if (doctors !== null) return; // already fetched once, no need to refetch every click
    setLoading(true);
    try {
      const { data } = await api.get('/doctors', { params: { department: departmentId, limit: 100 } });
      setDoctors(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="View doctors in this department"
        className="inline-flex items-center justify-center min-w-[26px] px-2 py-1 rounded-full text-[13px] font-semibold bg-primary-light text-primary-dark hover:bg-primary hover:text-white transition-colors cursor-pointer"
      >
        {count ?? 0}
      </button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-surface rounded-xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-section-title">Doctors &mdash; {departmentName}</h2>
              <button className="icon-btn" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-2">
              {loading && <div className="text-meta text-center py-4">Loading...</div>}
              {!loading && doctors?.length === 0 && <div className="text-meta text-center py-4">No doctors in this department.</div>}
              {!loading &&
                doctors?.map((d) => (
                  <div key={d._id} className="flex items-center justify-between gap-3 p-2.5 border border-border rounded-md">
                    <div>
                      <div className="text-[15px] font-medium text-slate-800">Dr. {d.user?.name}</div>
                      <div className="text-meta">{d.specialization}</div>
                    </div>
                    {d.onLeave && (
                      <span className="text-[12px] font-medium text-amber-600 whitespace-nowrap flex-shrink-0">On Leave</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
