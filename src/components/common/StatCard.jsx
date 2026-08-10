export default function StatCard({ icon: Icon, label, value, tone = 'teal', sub }) {
  const tones = {
    teal: 'border-l-teal-500',
    blue: 'border-l-blue-500',
    amber: 'border-l-amber-500',
    green: 'border-l-emerald-500',
    red: 'border-l-rose-500',
  };
  
  const iconTones = {
    teal: 'text-teal-600 bg-teal-50',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    green: 'text-emerald-600 bg-emerald-50',
    red: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className={`p-6 bg-white rounded-xl border border-slate-200 border-l-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${tones[tone] || tones.teal}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-slate-500 font-medium text-[13px] uppercase tracking-wider mb-2">{label}</span>
          <span className="text-3xl font-bold tracking-tight text-slate-800">{value}</span>
          {sub && <span className="text-slate-500 text-[13px] mt-2 font-medium">{sub}</span>}
        </div>
        <div className={`p-3 rounded-xl ${iconTones[tone] || iconTones.teal}`}>
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
