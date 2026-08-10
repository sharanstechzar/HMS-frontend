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
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { MODULES, ADMIN } from './config/modules';

// Standard (non-special) modules are rendered by the generic ModulePage,
// driven entirely by the config in config/modules.js.
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

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
