import { useEffect, useState } from 'react';
import {
  Users, CalendarClock, BedDouble, Wallet, LogOut as DischargeIcon,
  AlertTriangle, Receipt, FlaskConical, Pill, Activity, ChevronRight, UserRound
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/common/StatCard';

const COLORS = ['#10b981', '#cbd5e1']; // Emerald and Slate-300

const Badge = ({ children, tone = 'gray' }) => {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold border ${tones[tone]}`}>
      {children}
    </span>
  );
};

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Activity className="animate-pulse text-teal-500" size={40} />
        <p className="text-slate-500 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-red-700">
      Could not load dashboard data. Please try refreshing the page.
    </div>
  );

  const bedChartData = [
    { name: 'Occupied', value: data.bedOccupancy?.occupied || 0 },
    { name: 'Available', value: data.bedOccupancy?.available || 0 },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          {getGreeting()}, <span className="text-teal-600">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-500 text-[15px] font-medium">
          Here's your comprehensive overview for today.
        </p>
      </div>

      {/* ---- Universal stats (every role sees these) ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Wallet} label="Today's Revenue" value={`₹${(data.todaysRevenue || 0).toLocaleString()}`} tone="green" />
            <StatCard icon={DischargeIcon} label="Today's Discharges" value={data.todaysDischarges || 0} tone="blue" />
            <StatCard icon={Receipt} label="Pending Bills" value={data.pendingBills?.count || 0} tone="red" sub={`₹${(data.pendingBills?.amount || 0).toLocaleString()} outstanding`} />
            <StatCard icon={AlertTriangle} label="Low Stock Medicines" value={data.lowStockMedicines || 0} tone="amber" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart 1: Appointments */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:p-8 flex flex-col relative">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[18px] font-bold text-slate-800">Appointments Trend</h3>
                  <p className="text-slate-500 text-[13px] font-medium mt-1">Last 7 days overview</p>
                </div>
                <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                  <Activity size={20} />
                </div>
              </div>
              
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyAppointmentsTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}} 
                      contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 600, color: '#1e293b'}} 
                    />
                    <Bar dataKey="count" fill="url(#colorCount)" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Bed Occupancy */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:p-8 flex flex-col relative">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[18px] font-bold text-slate-800">Bed Occupancy</h3>
                  <p className="text-slate-500 text-[13px] font-medium mt-1">Current real-time status</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BedDouble size={20} />
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center min-h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="pieOccupied" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient id="pieAvailable" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#f1f5f9" />
                      </linearGradient>
                    </defs>
                    <Pie 
                      data={bedChartData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" cy="50%" 
                      innerRadius={85} 
                      outerRadius={120} 
                      paddingAngle={5}
                      stroke="none"
                    >
                      {bedChartData.map((entry, i) => (
                        <Cell key={i} fill={i === 0 ? 'url(#pieOccupied)' : 'url(#pieAvailable)'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px', fontWeight: 600}} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-bold text-slate-800">{Math.round((data.bedOccupancy?.occupied / data.bedOccupancy?.total) * 100 || 0)}%</span>
                  <span className="text-[13px] font-medium text-slate-500 uppercase tracking-wide">Occupied</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---- Doctor dashboard ---- */}
      {user.role === 'doctor' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mt-2">
          <div className="p-6 lg:px-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-[18px] font-bold text-slate-800">Today's Appointments</h3>
              <p className="text-slate-500 text-[13px] font-medium mt-1">Your scheduled patients for today</p>
            </div>
          </div>
          
          {(data.myTodaysAppointments || []).length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <CalendarClock size={28} />
              </div>
              <p className="text-slate-500 font-medium text-[15px]">No appointments scheduled for today.</p>
              <p className="text-slate-400 text-[13px] mt-1">Enjoy your free time or check back later.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 p-2">
              {(data.myTodaysAppointments || []).map((a) => (
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group cursor-default" key={a._id}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-inner">
                      #{a.tokenNumber}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-[15px]">{a.patient?.name}</span>
                      <span className="text-slate-500 text-[13px] font-medium">{a.patient?.patientId}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col text-right">
                      <span className="font-semibold text-slate-700">{a.timeSlot}</span>
                      <span className="text-[12px] font-medium text-slate-400">Time</span>
                    </div>
                    <Badge tone={a.status === 'completed' ? 'green' : a.status === 'in_progress' ? 'amber' : 'teal'}>
                      {a.status.replace('_', ' ')}
                    </Badge>
                    <button className="text-slate-400 group-hover:text-teal-600 transition-colors p-2 rounded-full group-hover:bg-teal-50">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Receptionist queue ---- */}
      {user.role === 'receptionist' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mt-2">
          <div className="p-6 lg:px-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-[18px] font-bold text-slate-800">Today's Queue</h3>
              <p className="text-slate-500 text-[13px] font-medium mt-1">Live patient waiting list</p>
            </div>
          </div>
          
          {(data.queue || []).length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <Users size={28} />
              </div>
              <p className="text-slate-500 font-medium text-[15px]">The queue is currently empty.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 p-2">
              {(data.queue || []).map((a) => (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors" key={a._id}>
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-inner shrink-0">
                    #{a.tokenNumber}
                  </div>
                  
                  <div className="flex flex-col min-w-[200px] flex-1">
                    <span className="font-semibold text-slate-800 text-[15px]">{a.patient?.name}</span>
                    <span className="text-slate-500 text-[13px] font-medium flex items-center gap-1">
                      <UserRound size={12} /> {a.patient?.patientId}
                    </span>
                  </div>
                  
                  <div className="flex flex-col min-w-[150px] flex-1">
                    <span className="text-[12px] font-medium text-slate-400">Doctor</span>
                    <span className="font-semibold text-slate-700 truncate">Dr. {a.doctor?.user?.name}</span>
                  </div>
                  
                  <div className="shrink-0 flex items-center">
                    <Badge tone={a.status === 'waiting' ? 'amber' : 'teal'}>
                      {a.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Pharmacist dashboard ---- */}
      {user.role === 'pharmacist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
          <StatCard icon={Pill} label="Low Stock Items" value={(data.lowStock || []).length} tone="amber" />
          <StatCard icon={AlertTriangle} label="Expiring within 30 days" value={(data.expiringSoon || []).length} tone="red" />
        </div>
      )}

      {/* ---- Lab/Radiology dashboard ---- */}
      {['lab_technician', 'radiologist'].includes(user.role) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
          <StatCard icon={FlaskConical} label="Pending Orders" value={data.pendingOrders || 0} tone="amber" />
        </div>
      )}

      {/* ---- Accountant / Cashier dashboard ---- */}
      {['accountant', 'cashier'].includes(user.role) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
          <StatCard icon={Wallet} label="Today's Collection" value={`₹${(data.todaysCollection || 0).toLocaleString()}`} tone="green" />
          <StatCard icon={Receipt} label="Pending Bills" value={data.pendingBills?.count || 0} tone="red" sub={`₹${(data.pendingBills?.amount || 0).toLocaleString()} outstanding`} />
        </div>
      )}
    </div>
  );
}
