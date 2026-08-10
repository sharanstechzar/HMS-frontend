import {
  LayoutDashboard, Users, Stethoscope, Building2, CalendarClock, ClipboardList,
  BedDouble, Siren, FileHeart, Pill, FlaskConical, ScanLine, HeartPulse,
  BedSingle, Receipt, ShieldCheck, Scissors, Droplet, Truck, UserCog,
  Boxes, Wallet, BarChart3, BellRing, FolderOpen, Settings as SettingsIcon,
  Activity, Tent, Droplets, KeyRound
} from 'lucide-react';
import DoctorCountBadge from '../components/common/DoctorCountBadge';

// Role groups mirrored from backend/src/config/roleGroups.js
export const ADMIN = ['super_admin', 'hospital_admin'];
export const CLINICAL = ['super_admin', 'hospital_admin', 'doctor', 'nurse'];
export const FRONT_DESK = ['super_admin', 'hospital_admin', 'receptionist'];
export const ALL_STAFF = [
  'super_admin', 'hospital_admin', 'doctor', 'nurse', 'receptionist',
  'pharmacist', 'lab_technician', 'radiologist', 'accountant', 'cashier',
];
export const BILLING = ['super_admin', 'hospital_admin', 'accountant', 'cashier'];
export const PHARMACY = ['super_admin', 'hospital_admin', 'pharmacist'];
export const LAB = ['super_admin', 'hospital_admin', 'lab_technician', 'doctor'];
export const RADIOLOGY = ['super_admin', 'hospital_admin', 'radiologist', 'doctor'];
export const EVERYONE = [...ALL_STAFF, 'patient'];
export const EXPORT_ROLES = ADMIN;
export const ROLES = EVERYONE;

export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: EVERYONE },

  { key: 'patients', label: 'Patients', icon: Users, path: '/patients', endpoint: '/patients', roles: ALL_STAFF, special: true,
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'], required: true },
      { name: 'dob', label: 'Date of Birth', type: 'date' },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'] },
      { name: 'address', label: 'Address', type: 'textarea' },
    ],
    columns: ['patientId', 'name', 'gender', 'phone', 'bloodGroup'],
  },

  { key: 'doctors', label: 'Doctors', icon: Stethoscope, path: '/doctors', endpoint: '/doctors', roles: ALL_STAFF,
    fields: [
      // Only staff with the "doctor" role can be linked here - a User can only ever
      // be linked to one Doctor profile (schema-enforced), so this just narrows the
      // list to relevant candidates; picking one already linked still correctly errors.
      { name: 'user', label: 'User Account', type: 'reference', refEndpoint: '/users', refParams: { role: 'doctor', limit: 200 }, refLabel: 'name', required: true },
      { name: 'department', label: 'Department', type: 'reference', refEndpoint: '/departments', refLabel: 'name', required: true },
      { name: 'qualification', label: 'Qualification', type: 'text', required: true },
      { name: 'specialization', label: 'Specialization', type: 'text', required: true },
      { name: 'experienceYears', label: 'Experience (years)', type: 'number' },
      { name: 'consultationFee', label: 'Consultation Fee', type: 'number' },
      { name: 'availableDays', label: 'Available Days', type: 'checkboxGroup', options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      { name: 'availableFrom', label: 'Available From', type: 'time' },
      { name: 'availableTo', label: 'Available To', type: 'time' },
      { name: 'onLeave', label: 'Currently On Leave', type: 'checkbox' },
      { name: 'leaves', label: 'Leave Records', type: 'array', itemFields: [
        { name: 'fromDate', label: 'From', type: 'date' },
        { name: 'toDate', label: 'To', type: 'date' },
        { name: 'reason', label: 'Reason', type: 'text' },
      ] },
    ],
    columns: [
      { key: 'user', label: 'Doctor', render: (row) => <span className="font-medium text-slate-800">Dr. {row.user?.name || '—'}</span> },
      { key: 'department', label: 'Department' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'experienceYears', label: 'Experience' },
      { key: 'consultationFee', label: 'Fee' },
      { key: 'contact', label: 'Contact', render: (row) => (
        <span className="flex flex-col text-[13px]">
          <span>{row.user?.email || '—'}</span>
          {row.user?.phone && <span className="text-slate-500">{row.user.phone}</span>}
        </span>
      ) },
      { key: 'onLeave', label: 'Status', render: (row) => (
        <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${row.onLeave ? 'text-amber-600' : 'text-success'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.onLeave ? 'bg-amber-500' : 'bg-success'}`} />
          {row.onLeave ? 'On Leave' : 'Active'}
        </span>
      ) },
    ],
    writeRoles: ADMIN,
  },

  { key: 'departments', label: 'Departments', icon: Building2, path: '/departments', endpoint: '/departments', roles: ALL_STAFF,
    fields: [
      { name: 'name', label: 'Department Name', type: 'text', required: true },
      { name: 'headOfDepartment', label: 'Head of Department', type: 'reference', refEndpoint: '/users', refParams: { role: 'doctor', limit: 200 }, refLabel: 'name' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    columns: [
      { key: 'name', label: 'Department' },
      { key: 'headOfDepartment', label: 'Head of Department' },
      { key: 'doctorCount', label: 'Doctors', render: (row) => (
        <DoctorCountBadge departmentId={row._id} departmentName={row.name} count={row.doctorCount} />
      ) },
      { key: 'description', label: 'Description' },
    ],
    writeRoles: ADMIN,
  },

  { key: 'appointments', label: 'Appointments', icon: CalendarClock, path: '/appointments', endpoint: '/appointments', roles: ALL_STAFF, special: true },

  { key: 'opd', label: 'OPD', icon: ClipboardList, path: '/opd', endpoint: '/opd-visits', roles: ALL_STAFF, special: true,
    fields: [
      { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
      { name: 'doctor', label: 'Doctor', type: 'doctor', required: true },
      { name: 'symptoms', label: 'Symptoms', type: 'textarea' },
      { name: 'diagnosis', label: 'Diagnosis', type: 'textarea' },
      { name: 'doctorNotes', label: "Doctor's Notes", type: 'textarea' },
      { name: 'treatmentPlan', label: 'Treatment Plan', type: 'textarea' },
      { name: 'followUpDate', label: 'Follow-up Date', type: 'date' },
    ],
    columns: ['visitDate', 'diagnosis', 'status'],
    writeRoles: CLINICAL,
  },

  { key: 'ipd', label: 'IPD / Admissions', icon: BedDouble, path: '/ipd', endpoint: '/admissions', roles: ALL_STAFF, special: true },

  { key: 'emergency', label: 'Emergency', icon: Siren, path: '/emergency', endpoint: '/emergency', roles: ALL_STAFF, special: true,
    fields: [
      { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
      { name: 'triageLevel', label: 'Triage Level', type: 'select', options: ['critical', 'urgent', 'stable'], required: true },
      { name: 'arrivalMode', label: 'Arrival Mode', type: 'select', options: ['ambulance', 'walk_in', 'referred'] },
      { name: 'ambulance', label: 'Ambulance', type: 'reference', refEndpoint: '/ambulances', refLabel: 'vehicleNumber' },
      { name: 'attendingDoctor', label: 'Attending Doctor', type: 'doctor' },
      { name: 'immediateTreatment', label: 'Immediate Treatment', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['in_treatment', 'stabilized', 'admitted', 'discharged', 'deceased'] },
    ],
    columns: ['triageLevel', 'arrivalMode', 'status', 'arrivalTime'],
    writeRoles: [...CLINICAL, 'receptionist'],
  },

  { key: 'prescriptions', label: 'Prescriptions', icon: FileHeart, path: '/prescriptions', endpoint: '/prescriptions', roles: ALL_STAFF, special: true },

  { key: 'pharmacy', label: 'Pharmacy', icon: Pill, path: '/pharmacy', endpoint: '/medicines', roles: ALL_STAFF, special: true },

  { key: 'laboratory', label: 'Laboratory', icon: FlaskConical, path: '/laboratory', endpoint: '/lab-orders', roles: ALL_STAFF, special: true,
    fields: [
      { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
      { name: 'doctor', label: 'Doctor', type: 'doctor' },
      { name: 'test', label: 'Lab Test', type: 'reference', refEndpoint: '/lab-tests', refLabel: 'name', required: true },
      { name: 'result', label: 'Result', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['ordered', 'sample_collected', 'result_ready', 'delivered'] },
    ],
    columns: ['status', 'orderedAt'],
    writeRoles: LAB,
  },

  { key: 'radiology', label: 'Radiology', icon: ScanLine, path: '/radiology', endpoint: '/radiology-orders', roles: ALL_STAFF, special: true,
    fields: [
      { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
      { name: 'doctor', label: 'Doctor', type: 'doctor' },
      { name: 'type', label: 'Scan Type', type: 'select', options: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'ECG'], required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['ordered', 'in_progress', 'report_ready'] },
    ],
    columns: ['type', 'status', 'orderedAt'],
    writeRoles: RADIOLOGY,
  },

  { key: 'nursing', label: 'Nursing', icon: HeartPulse, path: '/ipd', endpoint: '/admissions', roles: ['super_admin','hospital_admin','nurse','doctor'], hideFromSidebar: true },

  { key: 'beds', label: 'Bed Management', icon: BedSingle, path: '/beds', endpoint: '/beds', roles: ALL_STAFF,
    fields: [
      { name: 'bedNumber', label: 'Bed Number', type: 'text', required: true },
      { name: 'ward', label: 'Ward', type: 'reference', refEndpoint: '/wards', refLabel: 'name' },
      { name: 'status', label: 'Status', type: 'select', options: ['available', 'occupied', 'cleaning', 'maintenance'] },
      { name: 'dailyCharge', label: 'Daily Charge', type: 'number' },
    ],
    columns: ['bedNumber', 'status', 'dailyCharge'],
    writeRoles: [...ADMIN, 'nurse', 'receptionist'],
  },

  { key: 'billing', label: 'Billing', icon: Receipt, path: '/billing', endpoint: '/invoices', roles: ALL_STAFF, special: true },

  { key: 'insurance', label: 'Insurance', icon: ShieldCheck, path: '/insurance', endpoint: '/insurance-claims', roles: ALL_STAFF,
    fields: [
      { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
      { name: 'insuranceCompany', label: 'Insurance Company', type: 'text', required: true },
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true },
      { name: 'claimAmount', label: 'Claim Amount', type: 'number', required: true },
      { name: 'approvedAmount', label: 'Approved Amount', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['pre_auth', 'submitted', 'approved', 'rejected', 'settled'] },
    ],
    columns: ['insuranceCompany', 'policyNumber', 'claimAmount', 'status'],
    writeRoles: BILLING,
  },

  { key: 'surgery', label: 'Surgery', icon: Scissors, path: '/surgery', endpoint: '/surgeries', roles: ALL_STAFF, special: true,
    fields: [
      { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
      { name: 'surgeon', label: 'Surgeon', type: 'doctor', required: true },
      { name: 'surgeryType', label: 'Surgery Type', type: 'text', required: true },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
      { name: 'operationTheatre', label: 'Operation Theatre', type: 'text' },
      { name: 'operationNotes', label: 'Operation Notes', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
    ],
    columns: ['surgeryType', 'scheduledDate', 'operationTheatre', 'status'],
    writeRoles: CLINICAL,
  },

  { key: 'bloodbank', label: 'Blood Bank', icon: Droplet, path: '/blood-bank', endpoint: '/blood-bank', roles: ALL_STAFF,
    fields: [
      { name: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
      { name: 'unitsAvailable', label: 'Units Available', type: 'number', required: true },
      { name: 'lastDonorName', label: 'Last Donor Name', type: 'text' },
      { name: 'lastDonorPhone', label: 'Last Donor Phone', type: 'text' },
    ],
    columns: ['bloodGroup', 'unitsAvailable', 'lastDonorName'],
    writeRoles: CLINICAL,
  },

  { key: 'ambulance', label: 'Ambulance', icon: Truck, path: '/ambulance', endpoint: '/ambulances', roles: ALL_STAFF,
    fields: [
      { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text', required: true },
      { name: 'driverName', label: 'Driver Name', type: 'text', required: true },
      { name: 'driverPhone', label: 'Driver Phone', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['available', 'on_trip', 'maintenance'] },
    ],
    columns: ['vehicleNumber', 'driverName', 'driverPhone', 'status'],
    writeRoles: [...ADMIN, 'receptionist'],
  },

  { key: 'staff', label: 'Staff & Attendance', icon: UserCog, path: '/staff', endpoint: '/staff-attendance', roles: ALL_STAFF, special: true },

  { key: 'inventory', label: 'Inventory', icon: Boxes, path: '/inventory', endpoint: '/inventory', roles: ALL_STAFF,
    fields: [
      { name: 'name', label: 'Item Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['equipment', 'consumable'] },
      { name: 'vendor', label: 'Vendor', type: 'text' },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'reorderLevel', label: 'Reorder Level', type: 'number' },
      { name: 'unitCost', label: 'Unit Cost', type: 'number' },
    ],
    columns: ['name', 'category', 'quantity', 'reorderLevel'],
    writeRoles: ADMIN,
  },

  { key: 'accounts', label: 'Accounts', icon: Wallet, path: '/accounts', endpoint: '/accounts', roles: BILLING,
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: ['income', 'expense'], required: true },
      { name: 'category', label: 'Category', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'bankAccount', label: 'Bank Account', type: 'text' },
    ],
    columns: ['type', 'category', 'amount', 'date'],
    writeRoles: BILLING,
  },

  // === NEW MODULES ADDED FOR SYNCHRONIZATION ===

  { key: 'wards', label: 'Wards', icon: Tent, path: '/wards', endpoint: '/wards', roles: ALL_STAFF,
    fields: [
      { name: 'name', label: 'Ward Name', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'reference', refEndpoint: '/departments', refLabel: 'name' },
      { name: 'type', label: 'Ward Type', type: 'select', options: ['general', 'private', 'icu', 'maternity', 'pediatric'] },
      { name: 'capacity', label: 'Capacity', type: 'number', required: true },
    ],
    columns: ['name', 'type', 'capacity'],
    writeRoles: ADMIN,
  },

  { key: 'lab-tests', label: 'Lab Tests Catalog', icon: FlaskConical, path: '/lab-tests', endpoint: '/lab-tests', roles: LAB,
    fields: [
      { name: 'name', label: 'Test Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['hematology', 'biochemistry', 'microbiology', 'pathology', 'immunology'] },
      { name: 'cost', label: 'Cost', type: 'number', required: true },
      { name: 'turnaroundTime', label: 'Turnaround Time (hrs)', type: 'number' },
    ],
    columns: ['name', 'category', 'cost'],
    writeRoles: ADMIN,
  },

  { key: 'blood-requests', label: 'Blood Requests', icon: Droplets, path: '/blood-requests', endpoint: '/blood-requests', roles: CLINICAL,
    fields: [
      { name: 'patient', label: 'Patient', type: 'reference', refEndpoint: '/patients', refLabel: 'name', required: true },
      // BloodRequest.requestedBy refs User directly (any clinical staff, per spec), not Doctor - do not use the doctor picker here.
      { name: 'requestedBy', label: 'Requested By', type: 'reference', refEndpoint: '/users', refLabel: 'name' },
      { name: 'bloodGroup', label: 'Blood Group', type: 'select', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
      { name: 'units', label: 'Units Needed', type: 'number', required: true },
      { name: 'urgency', label: 'Urgency', type: 'select', options: ['routine', 'urgent', 'emergency'] },
      { name: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'fulfilled', 'rejected'] },
    ],
    columns: ['bloodGroup', 'units', 'urgency', 'status'],
    writeRoles: CLINICAL,
  },

  // fields/columns live in Users.jsx itself (roles are fetched dynamically
  // from /api/roles, since super_admin can add custom ones at runtime).
  { key: 'users', label: 'User Accounts', icon: Users, path: '/users', roles: ADMIN, special: true },

  { key: 'roles', label: 'Roles & Permissions', icon: KeyRound, path: '/roles', roles: ADMIN, special: true },

  { key: 'activity-logs', label: 'Activity Logs', icon: Activity, path: '/activity-logs', endpoint: '/activity-logs', roles: ADMIN,
    fields: [], // Typically read-only
    columns: ['action', 'module', 'details', 'createdAt'],
    writeRoles: [], // No one can write logs via UI
  },

  // ===========================================

  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/reports', roles: ADMIN, special: true },

  { key: 'notifications', label: 'Notifications', icon: BellRing, path: '/notifications', endpoint: '/notifications', roles: ALL_STAFF,
    fields: [
      { name: 'channel', label: 'Channel', type: 'select', options: ['sms', 'email', 'whatsapp', 'in_app'] },
      { name: 'type', label: 'Type', type: 'select', options: ['appointment_reminder', 'lab_report_ready', 'payment_reminder', 'general'] },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
    columns: ['type', 'channel', 'message', 'sentAt'],
    writeRoles: ADMIN,
  },

  { key: 'documents', label: 'Documents', icon: FolderOpen, path: '/documents', roles: ALL_STAFF, special: true },

  { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings', roles: EVERYONE },
];

export const getModuleByPath = (path) => MODULES.find((m) => m.path === path);
export const getSidebarModules = (role) =>
  MODULES.filter((m) => !m.hideFromSidebar && m.roles.includes(role));
