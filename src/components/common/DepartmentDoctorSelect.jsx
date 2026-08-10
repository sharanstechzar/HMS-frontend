// Two dependent selects (Department, then Doctor filtered to that department)
// used by hand-built forms that pick a doctor outside of FormModal
// (Appointments, IPD, Prescriptions). FormModal has its own equivalent
// built into its `type: 'doctor'` field for forms driven by a fields config.
export default function DepartmentDoctorSelect({
  departments,
  doctors,
  department,
  doctor,
  onDepartmentChange,
  onDoctorChange,
  required = false,
  labelDepartment = 'Department',
  labelDoctor = 'Doctor',
}) {
  const filteredDoctors = doctors.filter((d) => !department || (d.department?._id || d.department) === department);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-slate-500">
          {labelDepartment} {required && <span className="text-red-600">*</span>}
        </label>
        <select
          className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none"
          required={required}
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
        >
          <option value="">Select department...</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-slate-500">
          {labelDoctor} {required && <span className="text-red-600">*</span>}
        </label>
        <select
          className="p-2.5 px-3 border border-border rounded-md text-[15px] bg-white focus:ring-2 focus:ring-accent outline-none disabled:bg-slate-50 disabled:text-slate-400"
          required={required}
          value={doctor}
          onChange={(e) => onDoctorChange(e.target.value)}
          disabled={!department}
        >
          <option value="">
            {!department ? 'Select a department first' : filteredDoctors.length ? 'Select doctor...' : 'No doctors in this department'}
          </option>
          {filteredDoctors.map((d) => (
            <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
