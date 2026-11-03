import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrap a set of routes that require authentication and specific roles.
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute roles={['admin']} />}>
 *     <Route path="/admin/…" element={<Page />} />
 *   </Route>
 */
const ProtectedRoute = ({ roles }) => {
  const { user } = useAuth();

  // Not logged in → send to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but wrong role → redirect to own dashboard
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin')  return <Navigate to="/admin/dashboard"   replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard"  replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
