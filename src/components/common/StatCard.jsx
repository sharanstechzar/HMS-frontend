import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, tone = 'teal', sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon tone-${tone}`}>
        <Icon size={20} />
      </div>
      <div className="stat-info">
        <span className="text-meta">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="text-meta">{sub}</span>}
      </div>
    </div>
  );
}
