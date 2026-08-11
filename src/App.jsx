import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
import Appointments from './pages/Appointments';
import IPD from './pages/IPD';
import Pharmacy from './pages/Pharmacy';
import Billing from './pages/Billing';
import Prescriptions from './pages/Prescriptions';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import Settings from './pages/Settings';

// New standalone pages
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Opd from './pages/Opd';
import Emergency from './pages/Emergency';
import Surgery from './pages/Surgery';
import Laboratory from './pages/Laboratory';
import Radiology from './pages/Radiology';
import UsersPage from './pages/Users';
import RolesPermissions from './pages/RolesPermissions';

import { MODULES, ADMIN } from './config/modules';

// Standard (non-special) modules are rendered by the generic ModulePage
const genericModules = MODULES.filter((m) => m.endpoint && !m.special);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/ipd" element={<IPD />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={ADMIN}><Reports /></ProtectedRoute>} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<Settings />} />

            {/* Newly extracted dedicated pages */}
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/opd" element={<Opd />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/surgery" element={<Surgery />} />
            <Route path="/laboratory" element={<Laboratory />} />
            <Route path="/radiology" element={<Radiology />} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={ADMIN}><UsersPage /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute allowedRoles={ADMIN}><RolesPermissions /></ProtectedRoute>} />

            {/* Remaining generic lookup catalogs */}
            {genericModules.map((m) => (
              <Route key={m.key} path={m.path} element={<ModulePage />} />
            ))}
          </Route>

          <Route path="*" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
