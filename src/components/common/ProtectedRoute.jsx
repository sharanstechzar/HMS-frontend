import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 40 }}>
        <h2 className="text-section-title">Access Restricted</h2>
        <p className="text-body" style={{ marginTop: 8 }}>
          Your role ({user.role.replace(/_/g, ' ')}) does not have permission to view this page.
        </p>
      </div>
    );
  }
  return children;
}
