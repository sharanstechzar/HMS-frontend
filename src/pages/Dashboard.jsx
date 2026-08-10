import { useEffect, useState } from 'react';
import {
  Users, CalendarClock, BedDouble, Wallet, LogOut as DischargeIcon,
  AlertTriangle, Receipt, FlaskConical, Pill,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';
import './Dashboard.css';

const COLORS = ['#0f766e', '#e2e8f0'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/dashboard').then((res) => {
      if (mounted) setData(res.data.data);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <p className="text-body">Loading dashboard...</p>;
  if (!data) return <p className="text-body">Could not load dashboard data.</p>;

  const bedChartData = [
    { name: 'Occupied', value: data.bedOccupancy?.occupied || 0 },
    { name: 'Available', value: data.bedOccupancy?.available || 0 },
  ];

  return (
    <div>
      <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
        Welcome back, {user?.name?.split(' ')[0]}. Here's what's happening today.
      </p>

      {/* ---- Universal stats (every role sees these) ---- */}
      <div className="dash-grid">
        <StatCard icon={CalendarClock} label="Today's Appointments" value={data.todaysAppointments} tone="teal" />
        <StatCard icon={Users} label="Total Active Patients" value={data.totalPatients} tone="blue" />
        <StatCard icon={BedDouble} label="Active Admissions" value={data.activeAdmissions} tone="amber" />
        <StatCard
          icon={BedDouble}
          label="Bed Occupancy"
          value={`${data.bedOccupancy?.occupied || 0}/${data.bedOccupancy?.total || 0}`}
          tone="green"
          sub={`${data.bedOccupancy?.available || 0} beds available`}
        />
      </div>

      {/* ---- Admin-only extended dashboard ---- */}
      {['super_admin', 'hospital_admin'].includes(user.role) && (
        <>
          <div className="dash-grid" style={{ marginTop: 18 }}>
            <StatCard icon={Wallet} label="Today's Revenue" value={`₹${(data.todaysRevenue || 0).toLocaleString()}`} tone="green" />
            <StatCard icon={DischargeIcon} label="Today's Discharges" value={data.todaysDischarges || 0} tone="blue" />
            <StatCard icon={Receipt} label="Pending Bills" value={data.pendingBills?.count || 0} tone="red" sub={`₹${(data.pendingBills?.amount || 0).toLocaleString()} outstanding`} />
            <StatCard icon={AlertTriangle} label="Low Stock Medicines" value={data.lowStockMedicines || 0} tone="amber" />
          </div>

          <div className="dash-charts">
            <div className="chart-card">
              <h3 className="text-section-title" style={{ marginBottom: 14 }}>Appointments — Last 7 Days</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.weeklyAppointmentsTrend || []}>
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3 className="text-section-title" style={{ marginBottom: 14 }}>Bed Occupancy</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={bedChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {bedChartData.map((entry, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ---- Doctor dashboard ---- */}
      {user.role === 'doctor' && (
        <div className="dash-list-card">
          <h3 className="text-section-title" style={{ marginBottom: 14 }}>Today's Appointments</h3>
          {(data.myTodaysAppointments || []).length === 0 && <p className="text-meta">No appointments scheduled for today.</p>}
          {(data.myTodaysAppointments || []).map((a) => (
            <div className="dash-list-row" key={a._id}>
              <span className="badge badge-teal">#{a.tokenNumber}</span>
              <span className="text-body">{a.patient?.name}</span>
              <span className="text-meta">{a.timeSlot}</span>
              <span className="badge badge-gray">{a.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ---- Receptionist queue ---- */}
      {user.role === 'receptionist' && (
        <div className="dash-list-card">
          <h3 className="text-section-title" style={{ marginBottom: 14 }}>Today's Queue</h3>
          {(data.queue || []).length === 0 && <p className="text-meta">Queue is empty.</p>}
          {(data.queue || []).map((a) => (
            <div className="dash-list-row" key={a._id}>
              <span className="badge badge-teal">#{a.tokenNumber}</span>
              <span className="text-body">{a.patient?.name}</span>
              <span className="text-meta">Dr. {a.doctor?.user?.name}</span>
              <span className="badge badge-gray">{a.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ---- Pharmacist dashboard ---- */}
      {user.role === 'pharmacist' && (
        <div className="dash-grid" style={{ marginTop: 4 }}>
          <StatCard icon={Pill} label="Low Stock Items" value={(data.lowStock || []).length} tone="amber" />
          <StatCard icon={AlertTriangle} label="Expiring within 30 days" value={(data.expiringSoon || []).length} tone="red" />
        </div>
      )}

      {/* ---- Lab/Radiology dashboard ---- */}
      {['lab_technician', 'radiologist'].includes(user.role) && (
        <div className="dash-grid" style={{ marginTop: 4 }}>
          <StatCard icon={FlaskConical} label="Pending Orders" value={data.pendingOrders || 0} tone="amber" />
        </div>
      )}

      {/* ---- Accountant / Cashier dashboard ---- */}
      {['accountant', 'cashier'].includes(user.role) && (
        <div className="dash-grid" style={{ marginTop: 4 }}>
          <StatCard icon={Wallet} label="Today's Collection" value={`₹${(data.todaysCollection || 0).toLocaleString()}`} tone="green" />
          <StatCard icon={Receipt} label="Pending Bills" value={data.pendingBills?.count || 0} tone="red" sub={`₹${(data.pendingBills?.amount || 0).toLocaleString()} outstanding`} />
        </div>
      )}
    </div>
  );
}
