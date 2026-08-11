import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Droplet, AlertTriangle, ShieldCheck,
  CalendarClock, ClipboardList, BedDouble, Siren, FileHeart, Pill, FlaskConical,
  ScanLine, Receipt, Scissors, Droplets, BellRing,
} from 'lucide-react';
import api from '../api/axios';

const Badge = ({ children, tone = 'gray' }) => {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[12px] font-medium border ${tones[tone]} whitespace-nowrap`}>
      {children}
    </span>
  );
};

const Row = ({ children }) => (
  <div className="flex items-center justify-between gap-3 p-2.5 border border-border rounded-md text-[14px] flex-wrap">
    {children}
  </div>
);

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-slate-50/50">
        <Icon size={17} className="text-slate-500" />
        <h3 className="text-[15px] font-semibold text-slate-800">{title}</h3>
        <span className="ml-auto text-[13px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="p-4">
        {count === 0 ? <p className="text-meta py-1">No records.</p> : <div className="flex flex-col gap-2">{children}</div>}
      </div>
    </div>
  );
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function PatientDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/patients/${id}/timeline`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load patient'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading patient history...</div>;
  if (error) return <div className="p-6 bg-danger-light text-danger rounded-md">{error}</div>;
  if (!data) return null;

  const { patient, ...m } = data;

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <Link to="/patients" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-slate-500 hover:text-primary w-fit">
        <ArrowLeft size={16} /> Back to Patients
      </Link>

      {/* Patient summary */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-[26px] flex-shrink-0">
            {patient.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-page-title">{patient.name}</h1>
            <p className="text-meta mt-1">
              {patient.patientId} &middot; {patient.gender} {patient.age ? `, ${patient.age} yrs` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-[14px] text-slate-700">
            <Phone size={15} className="text-slate-400" /> {patient.phone || '—'}
          </div>
          <div className="flex items-center gap-2 text-[14px] text-slate-700">
            <Mail size={15} className="text-slate-400" /> {patient.email || '—'}
          </div>
          <div className="flex items-center gap-2 text-[14px] text-slate-700">
            <Droplet size={15} className="text-slate-400" /> {patient.bloodGroup || 'unknown'}
          </div>
          <div className="flex items-center gap-2 text-[14px] text-slate-700">
            <MapPin size={15} className="text-slate-400" /> {patient.address || '—'}
          </div>
        </div>

        {patient.allergies?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="flex items-center gap-1 text-[13px] font-medium text-red-600"><AlertTriangle size={14} /> Allergies:</span>
            {patient.allergies.map((a) => <Badge key={a} tone="red">{a}</Badge>)}
          </div>
        )}

        {patient.medicalHistory?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-[13px] font-medium text-slate-600">Medical History:</span>
            {patient.medicalHistory.map((h, i) => <Badge key={i} tone="amber">{h.condition}</Badge>)}
          </div>
        )}

        {patient.insurance?.provider && (
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <ShieldCheck size={14} className="text-primary" /> {patient.insurance.provider} &middot; Policy {patient.insurance.policyNumber}
          </div>
        )}
      </div>

      {/* Every module connected to this patient */}
      <Section icon={CalendarClock} title="Appointments" count={m.appointments.length}>
        {m.appointments.map((a) => (
          <Row key={a._id}>
            <span className="font-medium text-slate-800">{fmtDate(a.date)} &middot; {a.timeSlot}</span>
            <span className="text-slate-600">Dr. {a.doctor?.user?.name} ({a.department?.name})</span>
            <span className="text-meta">{a.reason || '—'}</span>
            <Badge tone={a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'red' : 'teal'}>{a.status.replace('_', ' ')}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={ClipboardList} title="OPD Visits" count={m.opdVisits.length}>
        {m.opdVisits.map((v) => (
          <Row key={v._id}>
            <span className="font-medium text-slate-800">{fmtDate(v.visitDate)}</span>
            <span className="text-slate-600">Dr. {v.doctor?.user?.name}</span>
            <span className="text-meta">{v.diagnosis || '—'}</span>
            <Badge tone={v.status === 'open' ? 'amber' : 'green'}>{v.status}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={BedDouble} title="IPD / Admissions" count={m.admissions.length}>
        {m.admissions.map((ad) => (
          <Row key={ad._id}>
            <span className="font-medium text-slate-800">{fmtDate(ad.admissionDate)}</span>
            <span className="text-slate-600">Dr. {ad.doctor?.user?.name}</span>
            <span className="text-meta">{ad.ward?.name} &middot; Bed {ad.bed?.bedNumber}</span>
            <Badge tone={ad.status === 'admitted' ? 'teal' : 'gray'}>{ad.status}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={Siren} title="Emergency Visits" count={m.emergencyCases.length}>
        {m.emergencyCases.map((e) => (
          <Row key={e._id}>
            <span className="font-medium text-slate-800">{fmtDateTime(e.arrivalTime)}</span>
            <span className="text-slate-600">Dr. {e.attendingDoctor?.user?.name || '—'}</span>
            <span className="text-meta">{e.immediateTreatment || '—'}</span>
            <Badge tone={e.triageLevel === 'critical' ? 'red' : e.triageLevel === 'urgent' ? 'amber' : 'gray'}>{e.triageLevel}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={FileHeart} title="Prescriptions" count={m.prescriptions.length}>
        {m.prescriptions.map((p) => (
          <Row key={p._id}>
            <span className="font-medium text-slate-800">{fmtDate(p.createdAt)}</span>
            <span className="text-slate-600">Dr. {p.doctor?.user?.name}</span>
            <span className="text-meta truncate max-w-xs" title={p.items.map((i) => i.medicineName).join(', ')}>
              {p.items.map((i) => i.medicineName).join(', ')}
            </span>
            <Badge tone={p.dispensed ? 'green' : 'amber'}>{p.dispensed ? 'Dispensed' : 'Pending'}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={Pill} title="Pharmacy Sales" count={m.pharmacySales.length}>
        {m.pharmacySales.map((s) => (
          <Row key={s._id}>
            <span className="font-medium text-slate-800">{fmtDate(s.createdAt)}</span>
            <span className="text-meta truncate max-w-xs" title={s.items.map((i) => i.medicine?.name).join(', ')}>
              {s.items.map((i) => i.medicine?.name).join(', ')}
            </span>
            <span className="text-slate-600">₹{s.totalAmount}</span>
            <Badge tone={s.paymentStatus === 'paid' ? 'green' : 'amber'}>{s.paymentStatus}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={FlaskConical} title="Laboratory Orders" count={m.labOrders.length}>
        {m.labOrders.map((l) => (
          <Row key={l._id}>
            <span className="font-medium text-slate-800">{fmtDate(l.orderedAt)}</span>
            <span className="text-slate-600">{l.test?.name}</span>
            <span className="text-meta">Dr. {l.doctor?.user?.name || '—'}</span>
            <Badge tone={l.status === 'result_ready' || l.status === 'delivered' ? 'green' : 'amber'}>{l.status.replace('_', ' ')}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={ScanLine} title="Radiology Orders" count={m.radiologyOrders.length}>
        {m.radiologyOrders.map((r) => (
          <Row key={r._id}>
            <span className="font-medium text-slate-800">{fmtDate(r.orderedAt)}</span>
            <span className="text-slate-600">{r.type}</span>
            <span className="text-meta">Dr. {r.doctor?.user?.name || '—'}</span>
            <Badge tone={r.status === 'report_ready' ? 'green' : 'amber'}>{r.status.replace('_', ' ')}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={Receipt} title="Billing / Invoices" count={m.invoices.length}>
        {m.invoices.map((inv) => (
          <Row key={inv._id}>
            <span className="font-medium text-slate-800">{inv.invoiceNumber}</span>
            <span className="text-slate-600">{fmtDate(inv.createdAt)}</span>
            <span className="text-meta">₹{inv.totalAmount} (paid ₹{inv.amountPaid})</span>
            <Badge tone={inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'red'}>{inv.status}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={ShieldCheck} title="Insurance Claims" count={m.insuranceClaims.length}>
        {m.insuranceClaims.map((c) => (
          <Row key={c._id}>
            <span className="font-medium text-slate-800">{c.insuranceCompany}</span>
            <span className="text-slate-600">Policy {c.policyNumber}</span>
            <span className="text-meta">Claim ₹{c.claimAmount}{c.approvedAmount ? ` (approved ₹${c.approvedAmount})` : ''}</span>
            <Badge tone={c.status === 'settled' || c.status === 'approved' ? 'green' : c.status === 'rejected' ? 'red' : 'amber'}>{c.status.replace('_', ' ')}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={Scissors} title="Surgeries" count={m.surgeries.length}>
        {m.surgeries.map((s) => (
          <Row key={s._id}>
            <span className="font-medium text-slate-800">{fmtDate(s.scheduledDate)}</span>
            <span className="text-slate-600">{s.surgeryType}</span>
            <span className="text-meta">Dr. {s.surgeon?.user?.name} &middot; {s.operationTheatre || '—'}</span>
            <Badge tone={s.status === 'completed' ? 'green' : s.status === 'cancelled' ? 'red' : 'teal'}>{s.status.replace('_', ' ')}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={Droplets} title="Blood Requests" count={m.bloodRequests.length}>
        {m.bloodRequests.map((b) => (
          <Row key={b._id}>
            <span className="font-medium text-slate-800">{b.bloodGroup} &middot; {b.unitsRequested} unit(s)</span>
            <span className="text-slate-600">Requested by {b.requestedBy?.name || '—'}</span>
            <span className="text-meta">{fmtDate(b.createdAt)}</span>
            <Badge tone={b.status === 'issued' ? 'green' : b.status === 'rejected' ? 'red' : 'amber'}>{b.status}</Badge>
          </Row>
        ))}
      </Section>

      <Section icon={BellRing} title="Notifications" count={m.notifications.length}>
        {m.notifications.map((n) => (
          <Row key={n._id}>
            <span className="font-medium text-slate-800">{n.type.replace(/_/g, ' ')}</span>
            <span className="text-meta truncate max-w-xs" title={n.message}>{n.message}</span>
            <span className="text-slate-500 text-[13px]">{n.channel}</span>
            <Badge tone={n.isRead ? 'gray' : 'teal'}>{n.isRead ? 'Read' : 'Unread'}</Badge>
          </Row>
        ))}
      </Section>
    </div>
  );
}
